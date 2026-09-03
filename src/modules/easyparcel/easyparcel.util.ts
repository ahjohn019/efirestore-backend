import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import {
  SubmitOrderDto,
  EasyParcelTrackingRequest,
} from './dto/submit-order.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { EasyParcelQuotationResponse } from './dto/submit-order.dto';

export function easyParcelUtil(httpService: HttpService) {
  return {
    submitEndpoint: (
      accessToken: string,
      url: string,
      payload:
        | SubmitOrderDto
        | ShipmentQuotationDto
        | EasyParcelTrackingRequest,
    ) => submitEndpoint(httpService, accessToken, url, payload),
    toShippingRates,
    toDeliveryEstimate,
  };
}

async function submitEndpoint(
  httpService: HttpService,
  accessToken: string,
  url: string,
  payload: SubmitOrderDto | ShipmentQuotationDto | EasyParcelTrackingRequest,
) {
  return await firstValueFrom(
    httpService.post(url, payload, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
    }),
  );
}

function toShippingRates(response: EasyParcelQuotationResponse) {
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

    return {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: Math.round(Number(total_amount) * 100),
          currency: currency.toLowerCase(),
        },
        display_name: service_name,
        delivery_estimate: toDeliveryEstimate(delivery_duration),
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

function toDeliveryEstimate(deliveryDuration: string | null) {
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
