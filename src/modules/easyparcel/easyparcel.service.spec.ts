import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosResponse } from 'axios';
import { of } from 'rxjs';
import { EasyparcelService } from './easyparcel.service';

describe('EasyparcelService', () => {
  let service: EasyparcelService;
  let httpService: { post: jest.Mock };

  beforeEach(async () => {
    httpService = { post: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EasyparcelService,
        { provide: HttpService, useValue: httpService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config = {
                EASY_PARCEL_AUTH_KEY: 'credentials',
                EASY_PARCEL_ACCESS_TOKEN: 'access-token',
                EASY_PARCEL_ENDPOINT: 'https://api.easyparcel.com/',
                EASY_PARCEL_REDIRECT_URL: 'https://example.com/callback',
                EASY_PARCEL_VERSION: 'open_api/2026-06/',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EasyparcelService>(EasyparcelService);
  });

  it('posts the login payload to the EasyParcel OAuth token endpoint', async () => {
    const payload = {
      grant_type: 'refresh_token' as const,
      refresh_token: 'refresh-token',
    };
    const response = {
      data: { access_token: 'access-token', token_type: 'Bearer' },
    } as AxiosResponse;
    httpService.post.mockReturnValue(of(response));

    await expect(service.login(payload)).resolves.toEqual({
      status: true,
      data: response.data,
    });
    expect(httpService.post).toHaveBeenCalledWith(
      'oauth/token',
      expect.any(URLSearchParams),
      {
        headers: {
          Authorization: 'Basic credentials',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const form = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(form.toString()).toBe(
      'grant_type=refresh_token&refresh_token=refresh-token&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
    );
  });

  it('posts shipment quotation requests to the configured API version', async () => {
    const payload = {
      shipment: [
        {
          sender: {
            postcode: '10150',
            subdivison_code: 'MY-02',
            country: 'MY',
          },
          receiver: {
            postcode: '14000',
            subdivison_code: 'MY-02',
            country: 'MY',
          },
          weight: 0.5,
          width: 5,
          length: 5,
          height: 5,
        },
      ],
    };
    const response = {
      data: {
        data: [
          {
            quotations: [
              {
                courier: {
                  service_id: 'EP-CS001',
                  service_name: 'PosLaju Standard',
                  courier_id: 'EP-CR001',
                  courier_name: 'Pos Laju',
                  delivery_duration: '{"type":"days","value":"4"}',
                },
                pricing: { currency: 'MYR', total_amount: '8.00' },
              },
              {
                courier: {
                  service_id: 'EP-CS002',
                  service_name: 'J&T Express',
                  courier_id: 'EP-CR002',
                  courier_name: 'J&T Express',
                  delivery_duration: '{"type":"days","value":"3"}',
                },
                pricing: { currency: 'MYR', total_amount: '10.00' },
              },
            ],
          },
        ],
      },
    } as AxiosResponse;
    httpService.post.mockReturnValue(of(response));

    await expect(service.getStripeShipmentQuotations(payload)).resolves.toEqual(
      {
        status: true,
        data: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 800, currency: 'myr' },
              display_name: 'PosLaju Standard',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 1 },
                maximum: { unit: 'business_day', value: 4 },
              },
              metadata: {
                service_id: 'EP-CS001',
                service_name: 'PosLaju Standard',
                courier_id: 'EP-CR001',
                courier_name: 'Pos Laju',
              },
            },
          },
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 1000, currency: 'myr' },
              display_name: 'J&T Express',
              delivery_estimate: {
                minimum: { unit: 'business_day', value: 1 },
                maximum: { unit: 'business_day', value: 3 },
              },
              metadata: {
                service_id: 'EP-CS002',
                service_name: 'J&T Express',
                courier_id: 'EP-CR002',
                courier_name: 'J&T Express',
              },
            },
          },
        ],
      },
    );
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.easyparcel.com/open_api/2026-06/shipment/quotations',
      payload,
      {
        headers: {
          Authorization: 'Bearer access-token',
          'Content-Type': 'application/json',
        },
      },
    );
  });
});
