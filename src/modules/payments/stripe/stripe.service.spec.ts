import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/modules/orders/orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from 'src/modules/users/entities/users.entity';
import { Repository } from 'typeorm';
import { Orders } from 'src/modules/orders/entities/orders.entity';
import { PaymentMethodType } from 'src/enum/stripe-payment-method.enum';
import { PaymentMode } from 'src/enum/stripe-payment-mode.enum';
import * as dotenv from 'dotenv';
dotenv.config();

describe('StripeService', () => {
  let service: StripeService;
  let mockCreateStripe: any;

  const createStripeDtoResult = {
    payment_method_types: ['card'] as PaymentMethodType[],
    line_items: [
      {
        price_data: {
          currency: 'myr',
          product_data: {
            name: 'T-shirtsss',
            metadata: {
              id: 2,
            },
          },
          unit_amount: 4000,
        },
        quantity: 1,
      },
    ],
    customer_email: 'admin_one@email.com',
    mode: PaymentMode.Payment,
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'STRIPE_PAYMENT_DEV_SECRET_KEY':
                  return process.env.STRIPE_PAYMENT_DEV_SECRET_KEY;
                case 'STRIPE_ENDPOINT_SECRET':
                  return process.env.STRIPE_ENDPOINT_SECRET;
                default:
                  break;
              }
            }),
          },
        },
        OrdersService,
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Orders),
          useClass: Repository,
        },
      ],
    }).compile();

    mockCreateStripe = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    };

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should successfully create a checkout session', async () => {
    const result = await service.createStripeCheckout(createStripeDtoResult);

    expect(result.code).toBe(200);
    expect(result.data).toBeDefined();
  });
});
