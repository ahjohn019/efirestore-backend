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
import { Helper } from 'src/utils/helper';
import { Gender } from 'src/enum/gender.enum';

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
        UserDetailsStripeService,
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
      relations: ['user_details', 'orders', 'stripe_users'],
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
      // stripe_verification: 1,
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

  const createUserDetailsPayloadInit = (
    stripe_verification: number,
    is_default: number,
  ) => {
    return {
      first_name: 'aaaaa',
      last_name: 'b',
      address_one: 'address_one',
      address_two: 'address_two',
      postal_code: '43500',
      city: 'kl',
      state: 'kl',
      country: 'malaysia',
      address_type: 'shipping',
      is_default,
      phone_number: '0192140567',
      identity_card_number: '950630145678',
      gender: 'male',
      // stripe_verification,
      user_id: 1,
    };
  };

  it('Check create user details - stripe verification and is default', async () => {
    const userDetailsPayload: any = createUserDetailsPayloadInit(1, 1);

    const saveUserDetailsSpy = jest
      .spyOn(userDetailsRepository, 'save')
      .mockResolvedValue(userDetailsPayload);

    const syncWithStripeDetailsSpy = jest
      .spyOn(userDetailsStripeService, 'syncWithStripeDetails')
      .mockResolvedValue(userDetailsPayload);

    const resultUserDetailsTest =
      await service.createUsersDetails(userDetailsPayload);
    const { result, userDetailsPayloadResult } = resultUserDetailsTest;

    const { user_id, ...noUserIdPayload } = userDetailsPayload;

    expect(result).toEqual(userDetailsPayloadResult);

    expect(saveUserDetailsSpy).toHaveBeenCalledWith(noUserIdPayload);

    expect(syncWithStripeDetailsSpy).toHaveBeenCalledWith(userDetailsPayload);
  });

  it('Check create user details - without stripe verification', async () => {
    const randomIsDefault = Math.floor(Math.random() * 1);

    const userDetailsPayload: any = createUserDetailsPayloadInit(
      0,
      randomIsDefault,
    );

    const saveUserDetailsSpy = jest
      .spyOn(userDetailsRepository, 'save')
      .mockResolvedValue(userDetailsPayload);

    const result = await service.createUsersDetails(userDetailsPayload);

    const { user_id, ...noUserIdPayload } = userDetailsPayload;

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: userDetailsPayload,
    });

    expect(saveUserDetailsSpy).toHaveBeenCalledWith(noUserIdPayload);
  });

  it('Check update user details - stripe verification and is default', async () => {
    const id = 3;

    const userDetailsPayload: any = {
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
      is_default: 1,
      phone_number: '0192140567',
      identity_card_number: '950630145678',
      gender: 'male',
      user_id: 1,
    };

    jest
      .spyOn(userDetailsRepository, 'update')
      .mockResolvedValue(userDetailsPayload);

    jest
      .spyOn(userDetailsRepository, 'findOne')
      .mockResolvedValue(userDetailsPayload);

    jest
      .spyOn(userDetailsStripeService, 'syncWithStripeDetails')
      .mockResolvedValue(userDetailsPayload);

    const result = await service.updateUsersDetails(userDetailsPayload);

    expect(result).toEqual(userDetailsPayload);

    expect(userDetailsRepository.update).toHaveBeenCalledWith(
      {
        user_id: 1,
        id,
      },
      userDetailsPayload,
    );
  });

  it('Check update user details - without is default', async () => {
    const id = 3;
    const is_default = 0;

    const userDetailsPayload: any = {
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
      is_default,
      phone_number: '0192140567',
      identity_card_number: '950630145678',
      gender: 'male',
      user_id: 1,
    };

    jest
      .spyOn(userDetailsRepository, 'update')
      .mockResolvedValue(userDetailsPayload);

    jest
      .spyOn(userDetailsRepository, 'findOne')
      .mockResolvedValue(userDetailsPayload);

    const result = await service.updateUsersDetails(userDetailsPayload);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: userDetailsPayload,
    });

    expect(userDetailsRepository.update).toHaveBeenCalledWith(
      {
        user_id: 1,
        id,
      },
      userDetailsPayload,
    );
  });

  it('Check remove user exists', async () => {
    const id = 3;
    const deletePayload = { affected: 1, raw: {} };

    jest.spyOn(usersRepository, 'delete').mockResolvedValue(deletePayload);

    const result = await service.remove(id);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: deletePayload,
    });
  });

  it('check find all users exists', async () => {
    const mockPaginationResponse = {
      data: [
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' },
      ],
      total_page: 1,
      current_page: 1,
      next_page: 1,
      previous_page: 1,
      total_data: 2,
    };

    jest
      .spyOn(Helper, 'calculatePagination')
      .mockResolvedValue(mockPaginationResponse);

    const result = await service.findAll({
      page: 1,
      take: 20,
    });

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: mockPaginationResponse,
    });
  });

  it('should find user by email', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'user',
      remember_token: null,
      created_at: new Date(),
      updated_at: new Date(),
      hashPassword: async () => {},
      user_details: [],
      orders: [],
      stripe_users: null,
    } as Users;

    jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

    const result = await service.findByEmail(mockUser.email);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: mockUser,
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { email: mockUser.email },
    });
  });

  it('should find user by password', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'user',
      remember_token: null,
      created_at: new Date(),
      updated_at: new Date(),
      hashPassword: async () => {},
      user_details: [],
      orders: [],
      stripe_users: null,
    } as Users;

    jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

    const result = await service.findByPassword(mockUser.password);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: mockUser,
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { password: mockUser.password },
    });
  });

  it('should find user by token', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'user',
      remember_token: 'some-token',
      created_at: new Date(),
      updated_at: new Date(),
      hashPassword: async () => {},
      user_details: [],
      orders: [],
      stripe_users: null,
    } as Users;

    jest.spyOn(usersRepository, 'findOne').mockResolvedValue(mockUser);

    const result = await service.findByToken(mockUser.remember_token);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: mockUser,
    });
    expect(usersRepository.findOne).toHaveBeenCalledWith({
      where: { remember_token: mockUser.remember_token },
    });
  });

  it('should update user', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed_password',
      role: 'user',
      remember_token: null,
      created_at: new Date(),
      updated_at: new Date(),
      hashPassword: async () => {},
      user_details: [],
      orders: [],
      stripe_users: null,
    } as Users;

    const updateData = {
      name: 'Updated Name',
      email: 'updated@example.com',
    };

    const updatedUser = {
      ...mockUser,
      ...updateData,
    } as Users;

    jest.spyOn(service, 'findOne').mockResolvedValue({
      status: 'success',
      code: 200,
      data: mockUser,
    });
    jest.spyOn(usersRepository, 'save').mockResolvedValue(updatedUser);

    const result = await service.update(mockUser.id, updateData);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: updatedUser,
    });
    expect(service.findOne).toHaveBeenCalledWith(mockUser.id);
    expect(usersRepository.save).toHaveBeenCalledWith({
      status: 'success',
      code: 200,
      data: mockUser,
      ...updateData,
    });
  });

  it('should find all users with pagination', async () => {
    const mockUsers = [
      {
        id: 1,
        email: 'test1@example.com',
        name: 'Test User 1',
        password: 'hashed_password',
        role: 'user',
        remember_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        hashPassword: async () => {},
        user_details: [],
        orders: [],
        stripe_users: null,
      } as Users,
      {
        id: 2,
        email: 'test2@example.com',
        name: 'Test User 2',
        password: 'hashed_password',
        role: 'user',
        remember_token: null,
        created_at: new Date(),
        updated_at: new Date(),
        hashPassword: async () => {},
        user_details: [],
        orders: [],
        stripe_users: null,
      } as Users,
    ];

    const paginationDto = {
      page: 1,
      take: 10,
    };

    const paginationResult = {
      data: mockUsers,
      total_page: 1,
      current_page: 1,
      next_page: null,
      previous_page: null,
      total_data: 2,
    };

    jest.spyOn(Helper, 'calculatePagination').mockResolvedValue(paginationResult);

    const result = await service.findAll(paginationDto);

    expect(result).toEqual({
      status: 'success',
      code: 200,
      data: paginationResult,
    });
    expect(Helper.calculatePagination).toHaveBeenCalledWith(
      paginationDto,
      usersRepository,
      null,
    );
  });

  it('should handle error when creating user', async () => {
    const createUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    };

    jest.spyOn(usersRepository, 'create').mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await service.create(createUserDto);

    expect(result).toEqual({
      status: 'error',
      code: 500,
      data: 'Database error',
    });
  });

  it('should handle error when user not found in createUsersDetails', async () => {
    const userDetailsDto = {
      user_id: 999,
      first_name: 'John',
      last_name: 'Doe',
      address_one: '123 Street',
      address_two: 'Apt 4',
      postal_code: '12345',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      phone_number: '1234567890',
      identity_card_number: '123456789012',
      gender: Gender.MALE,
      address_type: 'billing',
      is_default: 1,
    };

    jest.spyOn(service, 'findOne').mockResolvedValue(null);

    const result = await service.createUsersDetails(userDetailsDto);

    expect(result).toEqual({
      status: 'error',
      code: 500,
      data: 'Cannot read properties of null (reading \'data\')',
    });
  });
});
