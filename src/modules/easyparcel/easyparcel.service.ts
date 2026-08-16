import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoginEasyparcelDto } from './dto/login-easyparcel.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';

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
    private readonly configService: ConfigService,
  ) {}

  async login(payload: LoginEasyparcelDto) {
    const form = new URLSearchParams();
    form.append('grant_type', 'refresh_token');
    form.append('refresh_token', payload.refresh_token);
    form.append(
      'redirect_uri',
      this.configService.getOrThrow<string>('EASY_PARCEL_REDIRECT_URL'),
    );

    const response = await firstValueFrom(
      this.httpService.post('oauth/token', form, {
        headers: {
          Authorization:
            'Basic ' +
            this.configService.getOrThrow<string>('EASY_PARCEL_AUTH_KEY'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    return { status: true, data: response.data };
  }

  async getStripeShipmentQuotations(payload: ShipmentQuotationDto) {
    try {
      const url =
        this.configService.getOrThrow<string>('EASY_PARCEL_ENDPOINT') +
        this.configService.getOrThrow<string>('EASY_PARCEL_VERSION') +
        `shipment/quotations`;

      const response = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            Authorization:
              'Bearer ' +
              this.configService.getOrThrow<string>('EASY_PARCEL_ACCESS_TOKEN'),
            'Content-Type': 'application/json',
          },
        }),
      );

      return { status: true, data: this.toShippingRates(response.data) };
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
