import { Test, TestingModule } from '@nestjs/testing';
import { StripeService } from './stripe.service';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../../orders/orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Users } from '../../users/entities/users.entity';
import { UserAddress } from '../../users/entities/user-address.entity';
import { Repository } from 'typeorm';
import { PaymentMethodType } from '../../../enum/stripe-payment-method.enum';
import { PaymentMode } from '../../../enum/stripe-payment-mode.enum';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { CheckoutIdStripeDto } from './dto/checkout-stripe.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StripeService', () => {
  let service: StripeService;
  let mockStripe: any;
  let mockUsersRepository: Partial<Repository<Users>>;
  let mockUserAddressRepository: Partial<Repository<UserAddress>>;
  let mockOrdersService: Partial<OrdersService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    stripe_users: {
      stripe_account_id: 'cus_123',
    },
  };

  const mockCreateStripeDto: CreateStripeDto = {
    payment_method_types: [PaymentMethodType.Card],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Test Product',
            metadata: {
              id: 1,
            },
          },
          unit_amount: 1000,
        },
        quantity: 1,
      },
    ],
    customer_email: 'test@example.com',
    mode: PaymentMode.Payment,
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
  };

  const mockCheckoutSession = {
    id: 'cs_123',
    url: 'https://checkout.stripe.com/test',
    customer: {
      id: 'cus_123',
      address: {
        line1: '123 Main St',
        line2: 'Apt 4B',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'US',
      },
      shipping: {
        address: {
          line1: '456 Shipping St',
          line2: 'Suite 789',
          city: 'Los Angeles',
          state: 'CA',
          postal_code: '90001',
          country: 'US',
        },
        name: 'John Doe',
        phone: '123-456-7890',
      },
    },
    customer_details: {
      email: 'test@example.com',
    },
    amount_subtotal: 1000,
    amount_total: 1100,
  };

  const mockCheckoutLineItems = {
    data: [
      {
        price: {
          product: 'prod_123',
          unit_amount: 1000,
        },
        quantity: 1,
        amount_subtotal: 1000,
      },
    ],
  };

  const mockProduct = {
    id: 'prod_123',
    name: 'Test Product',
    metadata: {
      id: 1,
    },
  };

  beforeEach(async () => {
    mockStripe = {
      checkout: {
        sessions: {
          create: jest.fn().mockResolvedValue(mockCheckoutSession),
          retrieve: jest.fn().mockResolvedValue(mockCheckoutSession),
          listLineItems: jest.fn().mockResolvedValue(mockCheckoutLineItems),
        },
      },
      products: {
        retrieve: jest.fn().mockResolvedValue(mockProduct),
      },
      customers: {
        retrieve: jest.fn().mockResolvedValue(mockCheckoutSession.customer),
      },
      webhooks: {
        constructEvent: jest.fn().mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_123',
            },
          },
        }),
      },
    };

    mockUsersRepository = {
      findOne: jest.fn().mockResolvedValue(mockUser),
    };

    mockUserAddressRepository = {
      find: jest.fn().mockResolvedValue([
        { user_id: mockUser.id, address_type: 'billing', status: true },
        { user_id: mockUser.id, address_type: 'shipping', status: true },
      ]),
    };

    mockOrdersService = {
      create: jest.fn().mockResolvedValue({ success: true }),
      findStripeCheckout: jest.fn().mockResolvedValue({
        status: 'success',
        code: 200,
        data: null,
      }),
      update: jest.fn().mockResolvedValue({
        status: 'success',
        code: 200,
        data: { affected: 1 },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'STRIPE_PAYMENT_DEV_SECRET_KEY':
                  return 'test_secret_key';
                case 'STRIPE_ENDPOINT_SECRET':
                  return 'test_endpoint_secret';
                default:
                  return null;
              }
            }),
          },
        },
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
        {
          provide: getRepositoryToken(Users),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(UserAddress),
          useValue: mockUserAddressRepository,
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);

    // Override the stripe instance with our mock
    (service as any).stripe = mockStripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkout', () => {
    it('should successfully create a checkout session', async () => {
      const result = await service.checkout(mockCreateStripeDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual({
        status: 'success',
        code: 200,
        data: mockCheckoutSession,
      });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    it('should handle errors during checkout creation', async () => {
      // Mock the createStripeCheckout method to throw an error
      const originalCreateStripeCheckout = service.createStripeCheckout;
      service.createStripeCheckout = jest.fn().mockRejectedValue(new Error('Stripe API error'));

      const result = await service.checkout(mockCreateStripeDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Stripe API error');
      
      // Restore the original method
      service.createStripeCheckout = originalCreateStripeCheckout;
    });
  });

  describe('createStripeCheckoutField', () => {
    it('should successfully create checkout field data', async () => {
      const result = await service.createStripeCheckoutField(mockCreateStripeDto);

      const { customer_email, ...stripeData } = mockCreateStripeDto;
      expect(result).toEqual({
        ...stripeData,
        customer: mockUser.stripe_users.stripe_account_id,
      });
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockCreateStripeDto.customer_email },
        relations: ['stripe_users'],
      });
      expect(mockUserAddressRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: mockUser.id,
          status: true,
          address_type: expect.anything(),
        },
      });
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findOne = jest.fn().mockResolvedValue(null);

      await expect(service.createStripeCheckoutField(mockCreateStripeDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should block checkout when user has no active billing and shipping address', async () => {
      mockUserAddressRepository.find = jest.fn().mockResolvedValue([]);

      await expect(service.checkout(mockCreateStripeDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });
  });

  describe('retrieveStripeCheckout', () => {
    const mockCheckoutIdDto: CheckoutIdStripeDto = {
      checkoutId: 'cs_123',
    };

    it('should successfully retrieve checkout session', async () => {
      const result = await service.retrieveStripeCheckout(mockCheckoutIdDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockCheckoutSession);
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith(
        mockCheckoutIdDto.checkoutId,
        { expand: ['customer'] },
      );
    });

    it('should handle errors during checkout retrieval', async () => {
      const error = new Error('Stripe API error');
      mockStripe.checkout.sessions.retrieve.mockRejectedValue(error);

      const result = await service.retrieveStripeCheckout(mockCheckoutIdDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Stripe API error');
    });
  });

  describe('checkoutGetLineItems', () => {
    const mockCheckoutIdDto: CheckoutIdStripeDto = {
      checkoutId: 'cs_123',
    };

    it('should successfully retrieve checkout line items', async () => {
      const result = await service.checkoutGetLineItems(mockCheckoutIdDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockCheckoutLineItems);
      expect(mockStripe.checkout.sessions.listLineItems).toHaveBeenCalledWith(
        mockCheckoutIdDto.checkoutId,
      );
    });

    it('should handle errors during line items retrieval', async () => {
      const error = new Error('Stripe API error');
      mockStripe.checkout.sessions.listLineItems.mockRejectedValue(error);

      const result = await service.checkoutGetLineItems(mockCheckoutIdDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Stripe API error');
    });
  });

  describe('fetchProduct', () => {
    it('should successfully fetch product details', async () => {
      const result = await service.fetchProduct('prod_123');

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toEqual(mockProduct);
      expect(mockStripe.products.retrieve).toHaveBeenCalledWith('prod_123');
    });

    it('should handle errors during product retrieval', async () => {
      const error = new Error('Stripe API error');
      mockStripe.products.retrieve.mockRejectedValue(error);

      const result = await service.fetchProduct('prod_123');

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Stripe API error');
    });
  });

  describe('postWebhook', () => {
    const mockRequest = {
      headers: {
        'stripe-signature': 'test_signature'
      },
      rawBody: Buffer.from('test_body'),
    } as any;

    it('should successfully process checkout.session.completed event', async () => {
      const result = await service.postWebhook(mockRequest);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        mockRequest.rawBody,
        mockRequest.headers['stripe-signature'],
        'test_endpoint_secret',
      );
      expect(mockOrdersService.create).toHaveBeenCalled();
    });

    it('should handle unknown event types', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'unknown.event',
      });

      await expect(service.postWebhook(mockRequest)).resolves.toEqual({
        status: 'success',
        code: 200,
        data: {
          received: true,
          event_type: 'unknown.event',
        },
      });
    });

    it('should handle missing checkout ID', async () => {
      mockStripe.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: {
          object: {},
        },
      });

      await expect(service.postWebhook(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
