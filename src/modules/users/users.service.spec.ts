import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserDetailsStripeService } from './stripe/user-details.service';
import { StripeCustomerService } from '../payments/stripe/customer/customer.service';
import { ConfigService } from '@nestjs/config';
import { StripeUsers } from '../payments/stripe/entities/stripe.entity';
import { CreateUserDto } from './dto/create-user.dto';

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
          useValue: {},
        },
        {
          provide: StripeCustomerService,
          useValue: {},
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

  it('check find one user exists', async () => {
    const mockUser: any = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed_password',
      role: 'user',
      remember_token: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const findOneSpy = jest
      .spyOn(usersRepository, 'findOne')
      .mockResolvedValue(mockUser);

    const result = await service.findOne(mockUser.id);

    expect(result).toEqual({ data: mockUser, status: 'success', code: 200 });
    expect(findOneSpy).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      relations: ['user_details'],
    });
  });

  it('check create user exists', async () => {
    const createUser: any = {
      name: 'aaaaa',
      email: 'test1222@test.com',
      password: '123123',
      password_confirmation: '123123',
    };

    const createSpy = jest
      .spyOn(usersRepository, 'create')
      .mockReturnValue(createUser);

    const result = await service.create(createUser);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: createUser,
    });

    expect(createSpy).toHaveBeenCalledWith(createUser);
  });

  it('check update user exists', async () => {
    const id = 3;

    const updateUser: any = {
      id,
      first_name: 'a23a',
      last_name: 'b',
      address_one: 'address_one',
      address_two: 'address_two',
      postal_code: '43500',
      city: 'kl',
      state: 'kl',
      country: 'malaysia',
      address_type: 'shipping',
      is_default: 0,
      phone_number: '0192140567',
      identity_card_number: '950630145678',
      gender: 'male',
      stripe_verification: 1,
      user_id: 1,
    };

    jest.spyOn(usersRepository, 'findOne').mockResolvedValue({ id } as Users);

    const updateSpy = jest
      .spyOn(usersRepository, 'save')
      .mockReturnValue(updateUser);

    await service.update(id, updateUser);

    expect(updateSpy).toHaveBeenCalledWith({
      ...updateUser,
      status: 'success',
      code: 200,
      data: { id: 3 },
    });
  });
});
