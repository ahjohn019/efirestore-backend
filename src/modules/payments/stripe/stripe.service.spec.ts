import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/modules/orders/orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from 'src/modules/users/entities/users.entity';
import { Repository } from 'typeorm';
import { Orders } from 'src/modules/orders/entities/orders.entity';

describe('StripeService', () => {
  let service: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_PAYMENT_DEV_SECRET_KEY') {
                return 'sk_test_your_stripe_secret_key';
              }
              return null;
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

    service = module.get<StripeService>(StripeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
