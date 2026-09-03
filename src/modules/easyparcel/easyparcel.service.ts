import { HttpService } from '@nestjs/axios';
import {
  NotFoundException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { isDeepStrictEqual } from 'node:util';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { ShipmentTrackingDto } from './dto/shipment-tracking.dto';
import {
  SubmitOrderDto,
  EasyParcelError,
  EasyParcelSubmitOrderResponse,
  EasyParcelStatusLog,
  EasyParcelTrackingResponse,
  EasyParcelTrackingRequest,
} from './dto/submit-order.dto';
import { EasyParcelAuth } from './entities/easy-parcel-auth.entity';
import { Shipments } from '../orders/entities/shipments.entity';
import { ShipmentTrackLogs } from '../orders/entities/shipment-track-logs.entity';
import { easyParcelUtil } from './easyparcel.util';

@Injectable()
export class EasyparcelService {
  private readonly easyParcel = easyParcelUtil(this.httpService);
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(EasyParcelAuth)
    private readonly easyParcelAuthRepository: Repository<EasyParcelAuth>,
    @InjectRepository(Shipments)
    private readonly shipmentsRepository: Repository<Shipments>,
    @InjectRepository(ShipmentTrackLogs)
    private readonly shipmentTrackLogsRepository: Repository<ShipmentTrackLogs>,
    private readonly configService: ConfigService,
  ) {}

  private async fetchEasyParcelAuth() {
    const easyParcelAuth = await this.easyParcelAuthRepository.findOne({
      where: {
        type: this.configService.getOrThrow<string>('EASY_PARCEL_ENVIRONMENT'),
      },
      order: { id: 'DESC' },
    });

    if (!easyParcelAuth) {
      throw new InternalServerErrorException(
        'EasyParcel authentication record not found.',
      );
    }

    return easyParcelAuth;
  }

  private async buildEasyParcelUrl(prefix: string) {
    const easyParcelAuth = await this.fetchEasyParcelAuth();
    const { endpoint, version } = easyParcelAuth;

    return endpoint + version + prefix;
  }

  async login(payload: LoginDto) {
    try {
      const easyParcelAuth = await this.fetchEasyParcelAuth();

      const form = new URLSearchParams();
      form.append('grant_type', payload.grant_type);
      form.append(
        payload.grant_type === 'refresh_token' ? 'refresh_token' : 'code',
        payload.type === 'refresh_token'
          ? easyParcelAuth.refresh_token
          : easyParcelAuth.auth_token,
      );
      form.append('redirect_uri', easyParcelAuth.redirect_url);

      const response = await firstValueFrom(
        this.httpService.post('oauth/token', form, {
          headers: {
            Authorization: 'Basic ' + easyParcelAuth.auth_key,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      const tokenData = {
        auth_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
      };

      await this.easyParcelAuthRepository.update(easyParcelAuth.id, tokenData);

      return { status: true, data: response.data };
    } catch (error) {
      throw error;
    }
  }

  async getStripeShipmentQuotations(payload: ShipmentQuotationDto) {
    try {
      const easyParcelAuth = await this.fetchEasyParcelAuth();
      const url = await this.buildEasyParcelUrl('shipment/quotations');

      const response = await this.easyParcel.submitEndpoint(
        easyParcelAuth.auth_token,
        url,
        payload,
      );

      return {
        status: true,
        data: this.easyParcel.toShippingRates(response.data),
      };
    } catch (error) {
      throw error;
    }
  }

  async submitOrder(payload: SubmitOrderDto) {
    const shipmentExists = await this.shipmentsRepository.exists({
      where: { order_id: payload.order_id },
    });

    if (shipmentExists) {
      throw new ConflictException(
        `A shipment already exists for order ID ${payload.order_id}.`,
      );
    }

    const easyParcelAuth = await this.fetchEasyParcelAuth();
    const url = await this.buildEasyParcelUrl('shipment/submit_orders');

    try {
      const response = await this.easyParcel.submitEndpoint(
        easyParcelAuth.auth_token,
        url,
        payload,
      );

      await this.handleSubmitOrderResponse(payload, response.data);

      return { status: true, data: response.data };
    } catch (error) {
      const easyParcelError = error as EasyParcelError;

      if (easyParcelError.status === HttpStatus.UNAUTHORIZED) {
        const response = await this.refreshTokenIfNeeded(url, payload);
        await this.handleSubmitOrderResponse(payload, response.data);
      } else {
        throw error;
      }
    }
  }

  private async refreshTokenIfNeeded(
    url: string,
    payload: SubmitOrderDto | EasyParcelTrackingRequest,
  ) {
    const loginResponse = await this.login({
      grant_type: 'refresh_token',
      type: 'refresh_token',
    });
    const newAccessToken = loginResponse.data?.access_token;

    if (!newAccessToken) {
      throw new InternalServerErrorException(
        'EasyParcel token refresh did not return an access token.',
      );
    }

    const response = await this.easyParcel.submitEndpoint(
      newAccessToken,
      url,
      payload,
    );

    return { status: true, data: response.data };
  }

  async fetchTrackingStatus(trackingNumber: ShipmentTrackingDto) {
    const easyParcelAuth = await this.fetchEasyParcelAuth();
    const url = await this.buildEasyParcelUrl('shipment/tracking_status');

    const findShipment = await this.shipmentsRepository.findOne({
      where: { order_id: trackingNumber.order_id },
    });

    if (!findShipment) {
      throw new ConflictException(`No shipment found for order.`);
    }

    const awbNumber = findShipment.raw_data?.awb_number as string;

    if (!awbNumber) {
      throw new NotFoundException(`Awb Number not found for order.`);
    }

    const awbNumbers = [awbNumber];

    let responseData: EasyParcelTrackingResponse;

    try {
      const response = await this.easyParcel.submitEndpoint(
        easyParcelAuth.auth_token,
        url,
        { awb_numbers: awbNumbers },
      );

      responseData = response.data as EasyParcelTrackingResponse;

      const fetchStatusLogs = responseData.data?.results?.[0]?.status_log;
      await this.saveShipmentTrackLogs(
        trackingNumber.order_id,
        fetchStatusLogs,
      );

      const findShipmentStatus = await this.shipmentTrackLogsRepository.find({
        where: { order_id: trackingNumber.order_id },
        order: {
          created_at: 'DESC',
        },
      });

      return { status: true, data: findShipmentStatus };
    } catch (error) {
      const easyParcelError = error as EasyParcelError;

      if (easyParcelError.status === HttpStatus.UNAUTHORIZED) {
        const response = await this.refreshTokenIfNeeded(url, {
          awb_numbers: awbNumbers,
        });
        responseData = response.data as EasyParcelTrackingResponse;
      } else {
        throw error;
      }
    }
  }

  private async handleSubmitOrderResponse(
    payload: SubmitOrderDto,
    responseData: EasyParcelSubmitOrderResponse,
  ) {
    const fetchShipments = responseData.data?.[0]?.shipments;

    const failedShipment = fetchShipments.find(
      (shipment) => shipment.status?.toLowerCase() === 'error',
    );

    if (failedShipment) {
      throw new UnprocessableEntityException(
        failedShipment.errors?.[0]?.[0]?.message ||
          'EasyParcel shipment submission failed',
      );
    }

    await this.saveShipments(payload, fetchShipments);
  }

  private async saveShipments(
    payload: SubmitOrderDto,
    fetchShipments: unknown,
  ) {
    const shipments = payload.shipment.map((_, index) => {
      const responseShipment = fetchShipments[index] ?? {};
      const trackingNumber = responseShipment.shipment_number;

      if (!trackingNumber) {
        throw new InternalServerErrorException(
          'EasyParcel response did not include a shipment tracking number.',
        );
      }

      const courier = responseShipment.courier;
      const shipmentStatus = responseShipment.status ?? 'pending';

      return {
        order_id: payload.order_id,
        courier,
        tracking_number: trackingNumber,
        shipment_status: shipmentStatus,
        raw_data: responseShipment,
      };
    });

    await this.shipmentsRepository.save(shipments);
  }

  private async saveShipmentTrackLogs(
    orderId: number,
    fetchStatusLogs: EasyParcelStatusLog[],
  ) {
    await Promise.all(
      fetchStatusLogs.map(async (statusLog) => {
        const { tracking_status, ...rawData } = statusLog;
        const statusToSnakeCase = tracking_status
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '_');

        const findExistingLog = await this.shipmentTrackLogsRepository.exists({
          where: {
            order_id: orderId,
            tracking_status: statusToSnakeCase,
          },
        });

        if (!findExistingLog) {
          const shipmentTrackLog = {
            order_id: orderId,
            tracking_status: statusToSnakeCase,
            raw_data: rawData,
          };

          await this.shipmentTrackLogsRepository.save(shipmentTrackLog);
        }
      }),
    );
  }
}
