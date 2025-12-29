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
  let cartItemsRepository: Repository<CartItems>;

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
    cartItemsRepository = module.get<Repository<CartItems>>(
      getRepositoryToken(CartItems),
    );
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

  it('should test cart calculation - BaseQuantity = 5, Price = 5, Unit Total = 25', () => {
    const mockCartItem: CartItems = {
      id: 1,
      quantity: 0,
      unit_price: 0,
      unit_total: 0,
      cart_session_id: '',
      cart_id: 0,
      product_id: 0,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      cart: new Carts(),
    };

    const baseQuantity = 5;
    const price = 5;

    jest.spyOn(cartItemsRepository, 'findOne').mockResolvedValue(mockCartItem);

    const result = service.calculateCartUnitTotalProcess(
      baseQuantity,
      mockCartItem,
      price,
    );

    expect(result.unitTotal).toBe(25);
  });

  it('should test cart calculation - BaseQuantity = -2 , Mock cart quantity = 5, quantity = 1 and unit total = 5.', () => {
    const mockCartItem: CartItems = {
      id: 1,
      quantity: 2,
      unit_price: 0,
      unit_total: 0,
      cart_session_id: '',
      cart_id: 0,
      product_id: 0,
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
      cart: new Carts(),
    };

    const baseQuantity = -5;
    const price = 5;

    jest.spyOn(cartItemsRepository, 'findOne').mockResolvedValue(mockCartItem);

    const result = service.calculateCartUnitTotalProcess(
      baseQuantity,
      mockCartItem,
      price,
    );

    expect(result.unitTotal).toBe(5);
  });

  it('should test cart total qty and cart unit total', () => {
    const cartItemsList: CartItems[] = [
      {
        id: 30,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        quantity: 2,
        unit_price: 200,
        unit_total: 400,
        cart_session_id: 'ktwfdlh9aek',
        cart_id: 35,
        product_id: 1,
        cart: new Carts(),
      },
      {
        id: 31,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        quantity: 2,
        unit_price: 200,
        unit_total: 400,
        cart_session_id: 'ktwfdlh9aek',
        cart_id: 35,
        product_id: 2,
        cart: new Carts(),
      },
    ];

    const totalCartItems = 800;
    const totalQuantity = 4;

    const result = service.sumCartTotal(cartItemsList);

    expect(result.unit_total).toBe(totalCartItems);
    expect(result.quantity).toBe(totalQuantity);
  });
});
