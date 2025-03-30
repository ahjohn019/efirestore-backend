import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDetailsStripeService } from './stripe/user-details.service';
import { StripeCustomerService } from '../payments/stripe/customer/customer.service';
import { ConfigService } from '@nestjs/config';
import { StripeUsers } from '../payments/stripe/entities/stripe.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<Users>;
  let userDetailsRepository: Repository<UserDetails>;
  let userDetailsStripeService: UserDetailsStripeService;
  let stripeCustomerService: StripeCustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
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
        {
          provide: UserDetailsStripeService,
          useValue: {
            // Mock methods used by UsersService, if any
            someMethod: jest.fn(),
          },
        },
        {
          provide: StripeCustomerService,
          useValue: {
            // Mock methods used by UsersService, if any
            someMethod: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_PAYMENT_DEV_SECRET_KEY') {
                return 'sk_test_your_stripe_secret_key'; // Mock Stripe secret key
              }
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
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

  it('should find one user', async () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user',
      remember_token: null,
      created_at: new Date(),
      updated_at: new Date(),
      user_details: [],
    };

    const findOneSpy = jest
      .spyOn(usersRepository, 'findOne')
      .mockResolvedValue(mockUser as Users);

    const result = await service.findOne(mockUser.id);

    console.log('result', result);
    expect(result).toEqual(mockUser);
  });
});
