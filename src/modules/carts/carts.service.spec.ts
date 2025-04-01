import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CartItems, Carts } from './entities/carts.entity';
import { Repository } from 'typeorm';
import { Products } from '../products/entities/products.entity';
import { Users } from '../users/entities/users.entity';

describe('CartService', () => {
  let service: CartsService;
  let cartsRepository: Repository<Carts>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: getRepositoryToken(Carts),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(CartItems),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Users),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Products),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    cartsRepository = module.get<Repository<Carts>>(getRepositoryToken(Carts));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should view cart summary', async () => {
    const userId = 1;

    const mockCart: Carts = {
      id: 1,
      user_id: 1,
      created_at: new Date(),
      updated_at: new Date(),
      quantity: 0,
      subtotal: 0,
      grand_total: 0,
      cart_session_id: 'mock-session-id',
      cart_items: [],
      user: null,
      setCartSessionId: jest.fn(),
    };

    jest.spyOn(cartsRepository, 'findOne').mockResolvedValue(mockCart);

    const result = await service.viewCartSummary(userId);

    expect(result).toStrictEqual({
      status: 'success',
      code: 200,
      data: mockCart,
    });
  });
});
