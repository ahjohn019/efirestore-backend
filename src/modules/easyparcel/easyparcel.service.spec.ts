import { HttpService } from '@nestjs/axios';
import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { EasyparcelService } from './easyparcel.service';
import { EasyParcelAuth } from './entities/easy-parcel-auth.entity';
import {
  Shipments,
  ShipmentTrackingEvents,
} from '../orders/entities/shipments.entity';

describe('EasyparcelService', () => {
  let service: EasyparcelService;
  let httpService: { post: jest.Mock };
  let easyParcelAuthRepository: {
    findOne: jest.Mock;
    update: jest.Mock;
  };
  let shipmentsRepository: { create: jest.Mock; save: jest.Mock };
  let shipmentTrackingEventsRepository: { create: jest.Mock };

  beforeEach(async () => {
    httpService = { post: jest.fn() };
    easyParcelAuthRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        auth_token: 'database-auth-token',
        auth_key: 'database-auth-key',
        refresh_token: 'database-refresh-token',
        code: 'database-code',
        redirect_url: 'https://example.com/callback',
        endpoint: 'https://api.easyparcel.com/',
        version: 'open_api/2026-06/',
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    shipmentsRepository = {
      create: jest.fn((shipment) => shipment),
      save: jest.fn().mockResolvedValue([]),
    };
    shipmentTrackingEventsRepository = {
      create: jest.fn((event) => event),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EasyparcelService,
        { provide: HttpService, useValue: httpService },
        {
          provide: getRepositoryToken(EasyParcelAuth),
          useValue: easyParcelAuthRepository,
        },
        {
          provide: getRepositoryToken(Shipments),
          useValue: shipmentsRepository,
        },
        {
          provide: getRepositoryToken(ShipmentTrackingEvents),
          useValue: shipmentTrackingEventsRepository,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              const config = {
                EASY_PARCEL_ACCESS_TOKEN: 'access-token',
                EASY_PARCEL_ENDPOINT: 'https://api.easyparcel.com/',
                EASY_PARCEL_ENVIRONMENT: 'demo',
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
      type: 'refresh_token',
    };
    const response = {
      data: {
        access_token: 'access-token',
        refresh_token: 'new-refresh-token',
        token_type: 'Bearer',
      },
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
          Authorization: 'Basic database-auth-key',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    const form = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(form.toString()).toBe(
      'grant_type=refresh_token&refresh_token=database-refresh-token&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
    );
    expect(easyParcelAuthRepository.findOne).toHaveBeenCalledWith({
      where: { type: 'demo' },
      order: { id: 'DESC' },
    });
    expect(easyParcelAuthRepository.update).toHaveBeenCalledWith(1, {
      auth_token: 'access-token',
      refresh_token: 'new-refresh-token',
    });
  });

  it('rejects login when no EasyParcel authentication record exists', async () => {
    easyParcelAuthRepository.findOne.mockResolvedValue(null);

    await expect(
      service.login({
        grant_type: 'refresh_token',
        type: 'refresh-token',
      }),
    ).rejects.toThrow('EasyParcel authentication record not found.');
    expect(httpService.post).not.toHaveBeenCalled();
  });

  it('posts an authorization code using the stored authentication value', async () => {
    const response = {
      data: { access_token: 'access-token', token_type: 'Bearer' },
    } as AxiosResponse;
    httpService.post.mockReturnValue(of(response));

    await service.login({
      grant_type: 'authorization_code',
      type: 'easyparcel',
    });

    const form = httpService.post.mock.calls[0][1] as URLSearchParams;
    expect(form.toString()).toBe(
      'grant_type=authorization_code&code=database-auth-token&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
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
          Authorization: 'Bearer database-auth-token',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('submits an order using the EasyParcel shipment order payload', async () => {
    const payload = {
      order_id: 42,
      shipment: [
        {
          service_id: 'EP-CS09R',
          collection_date: '2026-08-17',
          weight: 0.5,
          height: 10,
          length: 10,
          width: 10,
          item: [
            {
              content: 'Electronics 2',
              weight: 0.5,
              height: 100,
              length: 100,
              width: 100,
              currency_code: 'MYR',
              value: 200,
              quantity: 1,
              insurance_purchase: {
                insurance_service_id: 23,
                invoices: 'https://example.com/invoice.webp',
                photos: 'https://example.com/photo.jpg',
              },
            },
          ],
          sender: {
            name: 'John Doe',
            phone_number_country_code: 'MY',
            phone_number: '1163642281',
            alternate_phone_number: '1163642281',
            alternate_phone_number_country_code: 'MY',
            email: 'sender@example.com',
            company_name: 'ABC Corp',
            address_1: '123 Main St',
            address_2: 'Suite 1',
            city: 'Penang',
            subdivision_code: 'MY-07',
            postcode: '10150',
            country_code: 'MY',
          },
          receiver: {
            name: 'Jane Smith',
            phone_number_country_code: 'MY',
            phone_number: '1163642281',
            email: 'receiver@example.com',
            address_1: '456 High St',
            city: 'Bayan Lepas',
            subdivision_code: 'MY-07',
            postcode: '10150',
            country_code: 'MY',
          },
          feature: {
            cod: { cod_amount: '', cod_currency: '' },
            email_tracking: false,
            whatsapp_tracking: 1 as const,
            awb_branding: false,
          },
        },
      ],
    };
    const response = {
      data: {
        data: [
          {
            order_number: 'EP123',
            shipments: [
              {
                status: 'success',
                tracking_number: 'TRACK123',
                courier_name: 'J&T Express',
                service_name: 'J&T Standard',
                parcel_number: 'PARCEL123',
                awb_id_link: 'https://example.com/label.pdf',
              },
            ],
          },
        ],
      },
    };
    httpService.post.mockReturnValue(of(response));

    await expect(service.submitOrder(payload)).resolves.toEqual({
      status: true,
      data: response.data,
    });
    expect(httpService.post).toHaveBeenCalledWith(
      'https://api.easyparcel.com/open_api/2026-06/shipment/submit_orders',
      payload,
      {
        headers: {
          Authorization: 'Bearer database-auth-token',
          'Content-Type': 'application/json',
        },
      },
    );
    expect(shipmentsRepository.save).toHaveBeenCalledWith([
      expect.objectContaining({
        order_id: 42,
        courier: 'J&T Express',
        service_type: 'J&T Standard',
        tracking_number: 'TRACK123',
        shipment_status: 'success',
        courier_reference: 'EP123',
        label_url: 'https://example.com/label.pdf',
        tracking_events: [
          expect.objectContaining({
            status: 'success',
            courier_status: 'success',
            raw_data: expect.objectContaining({
              order_number: 'EP123',
              tracking_number: 'TRACK123',
            }),
          }),
        ],
      }),
    ]);

    httpService.post.mockReset();
    httpService.post
      .mockReturnValueOnce(
        throwError(() => ({ status: HttpStatus.UNAUTHORIZED })),
      )
      .mockReturnValueOnce(of(response));
    jest.spyOn(service, 'login').mockResolvedValue({
      status: true,
      data: { access_token: 'refreshed-access-token' },
    });

    await expect(service.submitOrder(payload)).resolves.toEqual({
      status: true,
      data: response.data,
    });
    expect(shipmentsRepository.save).toHaveBeenCalledTimes(2);
    expect(service.login).toHaveBeenCalledWith({
      grant_type: 'refresh_token',
      type: 'refresh_token',
    });
    expect(httpService.post).toHaveBeenNthCalledWith(
      2,
      'https://api.easyparcel.com/open_api/2026-06/shipment/submit_orders',
      payload,
      {
        headers: {
          Authorization: 'Bearer refreshed-access-token',
          'Content-Type': 'application/json',
        },
      },
    );
  });
});
