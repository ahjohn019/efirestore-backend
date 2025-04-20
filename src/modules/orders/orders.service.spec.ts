import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Orders, OrderItems } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';
import { NotFoundException } from '@nestjs/common';
import { Helper } from '../../utils/helper';
import {
  CreateOrderDto,
  OrderItemDto,
  orderItemTotalPrice,
} from './dto/create-order.dto';
import { DeepPartial } from 'typeorm';
import { UsersService } from '../users/users.service';
import { UserDetails } from '../users/entities/users.entity';
import { UserDetailsStripeService } from '../users/stripe/user-details.service';
import { StripeCustomerService } from '../payments/stripe/customer/customer.service';
import { ConfigService } from '@nestjs/config';
import { StripeUsers } from '../payments/stripe/entities/stripe.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: Repository<Orders>;
  let usersRepository: Repository<Users>;
  let userDetailsRepository: Repository<UserDetails>;
  let userDetailsStripeService: UserDetailsStripeService;
  let stripeCustomerService: StripeCustomerService;

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
        {
          provide: getRepositoryToken(UserDetails),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(StripeUsers),
          useClass: Repository,
        },
        UserDetailsStripeService,
        {
          provide: StripeCustomerService,
          useValue: {
            show: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
          },
        },
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
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get<Repository<Orders>>(
      getRepositoryToken(Orders),
    );
    usersRepository = module.get<Repository<Users>>(getRepositoryToken(Users));
    userDetailsRepository = module.get<Repository<UserDetails>>(
      getRepositoryToken(UserDetails),
    );
    userDetailsStripeService = module.get<UserDetailsStripeService>(
      UserDetailsStripeService,
    );
    stripeCustomerService = module.get<StripeCustomerService>(
      StripeCustomerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an order successfully', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      } as Users;

      const orderItems: OrderItemDto[] = [
        {
          quantity: 2,
          unit_price: 10,
          product_id: 1,
          total_price: 20,
        },
        {
          quantity: 1,
          unit_price: 20,
          product_id: 2,
          total_price: 20,
        },
      ];

      const createOrderDto: CreateOrderDto = {
        title: 'Test Order',
        status: 'pending',
        shipping_address: '123 Ship St',
        billing_address: '123 Bill St',
        customer_email: 'test@example.com',
        items: orderItems,
        created_at: new Date(),
        updated_at: new Date(),
        subtotal: 0,
        grand_total: 0,
        admin_id: 0,
        user_id: 0,
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);
      jest
        .spyOn(orderRepository, 'save')
        .mockImplementation((order) => Promise.resolve(order as Orders));

      const result = await service.create(createOrderDto, 1);

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: createOrderDto.customer_email },
      });
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...createOrderDto,
        user_id: mockUser.id,
        admin_id: 1,
        user: mockUser,
        items: orderItems.map((item) => ({
          ...item,
          product: { id: item.product_id },
          total_price: item.unit_price * item.quantity,
        })),
        total_quantity: createOrderDto.items.reduce(
          (total: number, item: orderItemTotalPrice) => {
            return total + item.quantity;
          },
          0,
        ),
        subtotal: 40,
        grand_total: 40,
      });

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: expect.any(Object),
      });
    });

    it('should handle error when user not found', async () => {
      const createOrderDto: CreateOrderDto = {
        title: 'Test Order',
        status: 'pending',
        shipping_address: '123 Ship St',
        billing_address: '123 Bill St',
        customer_email: 'nonexistent@example.com',
        items: [],
        created_at: new Date(),
        updated_at: new Date(),
        subtotal: 0,
        grand_total: 0,
        admin_id: 0,
        user_id: 0,
      };

      jest.spyOn(usersRepository, 'findOne').mockResolvedValue(null);

      const result = await service.create(createOrderDto, 1);

      expect(result).toEqual({
        status: 'error',
        code: 500,
        data: "Cannot read properties of null (reading 'id')",
      });
    });
  });

  describe('calculateTotalPrice', () => {
    it('should calculate total price correctly', () => {
      const items = [
        { unit_price: 10, quantity: 2 },
        { unit_price: 20, quantity: 1 },
      ];
      const total = service.calculateTotalPrice(items);
      expect(total).toBe(40);
    });

    it('should return 0 for empty items array', () => {
      const items = [];
      const total = service.calculateTotalPrice(items);
      expect(total).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 1, title: 'Order 1' },
        { id: 2, title: 'Order 2' },
      ];

      const paginationResult = {
        data: mockOrders,
        total_page: 1,
        current_page: 1,
        next_page: null,
        previous_page: null,
        total_data: 2,
      };

      jest
        .spyOn(Helper, 'calculatePagination')
        .mockResolvedValue(paginationResult);

      const result = await service.findAll({ page: 1, take: 10 });

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: paginationResult,
      });
      expect(Helper.calculatePagination).toHaveBeenCalledWith(
        { page: 1, take: 10 },
        orderRepository,
        null,
        ['items'],
      );
    });
  });

  describe('findOne', () => {
    it('should find an order by id', async () => {
      const mockOrder = {
        id: 1,
        title: 'Test Order',
        items: [],
      } as Orders;

      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockOrder);

      const result = await service.findOne(1);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: mockOrder,
      });
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'user'],
      });
    });

    it('should handle not found error', async () => {
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: null,
      });
    });
  });

  describe('updateOrder', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 1,
        status: 'pending',
      };

      const updateStatusDto = {
        status: 'completed',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockOrder,
      });
      jest
        .spyOn(orderRepository, 'update')
        .mockResolvedValue({ affected: 1 } as any);

      const result = await service.updateOrder(1, updateStatusDto);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: { affected: 1 },
      });
      expect(orderRepository.update).toHaveBeenCalledWith(1, {
        status: 'completed',
      });
    });

    it('should handle not found error', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await service.updateOrder(999, { status: 'completed' });

      expect(result).toEqual({
        status: 'error',
        code: 500,
        data: 'Order Not Found.',
      });
    });
  });

  describe('remove', () => {
    it('should remove an order successfully', async () => {
      const deleteResult = { affected: 1, raw: {} };

      jest.spyOn(orderRepository, 'delete').mockResolvedValue(deleteResult);

      const result = await service.remove(1);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: deleteResult,
      });
      expect(orderRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should handle error when deleting non-existent order', async () => {
      jest
        .spyOn(orderRepository, 'delete')
        .mockRejectedValue(new Error('Delete failed'));

      const result = await service.remove(999);

      expect(result).toEqual({
        status: 'error',
        code: 500,
        data: 'Delete failed',
      });
    });
  });
});
