import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CronjobsService } from './cronjobs.service';
import { Orders } from '../modules/orders/entities/orders.entity';
import { Carts } from '../modules/carts/entities/carts.entity';
import { StripeService } from '../modules/payments/stripe/stripe.service';

describe('CronjobsService', () => {
  let service: CronjobsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronjobsService,
        {
          provide: getRepositoryToken(Orders),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Carts),
          useValue: {},
        },
        {
          provide: StripeService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CronjobsService>(CronjobsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
