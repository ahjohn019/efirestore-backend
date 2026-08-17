import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { SubmitOrderDto } from './dto/submit-order.dto';
import { EasyParcelAuth } from './entities/easy-parcel-auth.entity';

interface EasyparcelQuotation {
  courier: {
    service_name: string;
    courier_name: string;
    courier_code?: string;
    service_id?: string;
    delivery_duration: string | null;
    courier_id?: string;
  };
  pricing: {
    currency: string;
    total_amount: string;
  };
}

interface EasyparcelQuotationResponse {
  data?: Array<{ quotations?: EasyparcelQuotation[] }>;
}

@Injectable()
export class EasyparcelService {
  constructor(
    private readonly httpService: HttpService,
    @InjectRepository(EasyParcelAuth)
    private readonly easyParcelAuthRepository: Repository<EasyParcelAuth>,
  ) {}

  async login() {
    try {
      const easyParcelAuth = await this.easyParcelAuthRepository.findOne({
        order: { id: 'DESC' },
      });

      if (!easyParcelAuth) {
        throw new InternalServerErrorException(
          'EasyParcel authentication record not found.',
        );
      }

      const form = new URLSearchParams();
      form.append('grant_type', 'refresh_token');
      form.append('refresh_token', easyParcelAuth.refresh_token);
      form.append('redirect_uri', easyParcelAuth.redirect_url);

      const response = await firstValueFrom(
        this.httpService.post('oauth/token', form, {
          headers: {
            Authorization: 'Basic ' + easyParcelAuth.auth_token,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return { status: true, data: response.data };
    } catch (error) {
      throw error;
    }
  }

  async getStripeShipmentQuotations(payload: ShipmentQuotationDto) {
    try {
      const easyParcelAuth = await this.easyParcelAuthRepository.findOne({
        order: { id: 'DESC' },
      });

      const url =
        easyParcelAuth.endpoint +
        easyParcelAuth.version +
        `shipment/quotations`;

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: 'Bearer ' + easyParcelAuth.auth_token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return { status: true, data: this.toShippingRates(response.data) };
    } catch (error) {
      throw error;
    }
  }

  async submitOrder(payload: SubmitOrderDto) {
    try {
      const easyParcelAuth = await this.easyParcelAuthRepository.findOne({
        order: { id: 'DESC' },
      });

      const url =
        easyParcelAuth.endpoint +
        easyParcelAuth.version +
        'shipment/submit_orders';

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization: 'Bearer ' + easyParcelAuth.auth_token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return { status: true, data: response.data };
    } catch (error) {
      throw error;
    }
  }

  private toShippingRates(response: EasyparcelQuotationResponse) {
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
