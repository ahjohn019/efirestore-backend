import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import {
  SubmitOrderDto,
  EasyParcelError,
  EasyParcelQuotationResponse,
} from './dto/submit-order.dto';
import { EasyParcelAuth } from './entities/easy-parcel-auth.entity';

@Injectable()
export class EasyparcelService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(EasyParcelAuth)
    private readonly easyParcelAuthRepository: Repository<EasyParcelAuth>,
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

  private async submitEndpoint(
    accessToken: string,
    url: string,
    payload: SubmitOrderDto | ShipmentQuotationDto,
  ) {
    return await firstValueFrom(
      this.httpService.post(url, payload, {
        headers: {
          Authorization: 'Bearer ' + accessToken,
          'Content-Type': 'application/json',
        },
      }),
    );
  }

  async getStripeShipmentQuotations(payload: ShipmentQuotationDto) {
    try {
      const easyParcelAuth = await this.fetchEasyParcelAuth();
      const url = await this.buildEasyParcelUrl('shipment/quotations');

      const response = await this.submitEndpoint(
        easyParcelAuth.auth_token,
        url,
        payload,
      );

      return { status: true, data: this.toShippingRates(response.data) };
    } catch (error) {
      throw error;
    }
  }

  async submitOrder(payload: SubmitOrderDto) {
    const easyParcelAuth = await this.fetchEasyParcelAuth();
    const url = await this.buildEasyParcelUrl('shipment/submit_orders');

    try {
      const response = await this.submitEndpoint(
        easyParcelAuth.auth_token,
        url,
        payload,
      );

      if (response.data?.data[0]?.shipments[0]?.status == 'error') {
        throw new UnprocessableEntityException(
          response.data?.data[0]?.shipments[0]?.errors?.[0]?.[0]?.message ||
            'EasyParcel shipment submission failed',
        );
      }

      return { status: true, data: response.data };
    } catch (error) {
      const easyParcelError = error as EasyParcelError;

      if (easyParcelError.status === HttpStatus.UNAUTHORIZED) {
        return await this.refreshTokenIfNeeded(url, payload);
      } else {
        throw error;
      }
    }
  }

  private async refreshTokenIfNeeded(url: string, payload: SubmitOrderDto) {
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

    const response = await this.submitEndpoint(newAccessToken, url, payload);

    return { status: true, data: response.data };
  }

  private toShippingRates(response: EasyParcelQuotationResponse) {
    const fetchQuotations = response.data?.[0]?.quotations ?? [];

    return fetchQuotations.map((quotation) => {
      const {
        service_name,
        courier_name,
        service_id,
        courier_id,
        delivery_duration,
      } = quotation.courier;
      const { currency, total_amount } = quotation.pricing;

      const deliveryEstimate = this.toDeliveryEstimate(delivery_duration);

      return {
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(Number(total_amount) * 100),
            currency: currency.toLowerCase(),
          },
          display_name: service_name,
          delivery_estimate: deliveryEstimate,
          metadata: {
            service_id: service_id ?? '',
            service_name: service_name ?? '',
            courier_id: courier_id ?? '',
            courier_name: courier_name ?? '',
          },
        },
      };
    });
  }

  private toDeliveryEstimate(deliveryDuration: string | null) {
    let deliveryDurationValue = null;

    if (deliveryDuration !== null) {
      const convertedDuration = JSON.parse(deliveryDuration);
      deliveryDurationValue = parseInt(convertedDuration.value);
    }

    return {
      minimum: { unit: 'business_day', value: 1 },
      maximum: { unit: 'business_day', value: deliveryDurationValue ?? 1 },
    };
  }
}
