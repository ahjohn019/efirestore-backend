import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Orders } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Orders>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Orders),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Orders>>(getRepositoryToken(Orders));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

});
