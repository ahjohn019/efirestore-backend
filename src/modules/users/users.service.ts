import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, CreateUserDetailsDto, stripeUserAddressInterface } from './dto/create-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { StripeCustomerService } from 'src/modules/payments/stripe/customer/customer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    @Inject(forwardRef(() => StripeCustomerService))
    private readonly stripeCustomerService: StripeCustomerService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<{
    status: boolean;
    statusCode: number;
    data: Users;
  }> {
    const user = this.usersRepository.create(createUserDto);

    return {
      statusCode: 200,
      status: true,
      data: await this.usersRepository.save(user),
    };
  }

  async createUsersDetails(createUserDetailsDto: CreateUserDetailsDto) {
    const { user_id } = createUserDetailsDto;

    const findUser = await this.findOne(user_id);

    const { id } = findUser;

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const userDetailsResponse = await this.userDetailsRepository.save({
      ...createUserDetailsDto,
      user_id: id,
    });

    const { stripe_verification, is_default } = userDetailsResponse;

    if (stripe_verification && is_default) {
      return this.syncWithStripeDetails(userDetailsResponse);
    }

    return { status: true, data: userDetailsResponse };
  }

  private async syncWithStripeDetails(userDetailsResponse: CreateUserDetailsDto){
    const {
      first_name,
      last_name,
      address_type,
      user_id
    } = userDetailsResponse;

    const findUser = await this.findOne(user_id);
    const { email } = findUser;

    const findStripeVerificationByUserid =
      await this.stripeCustomerService.show(user_id);

    const userAddressPayload = this.createUserAddressPayload(userDetailsResponse);

    const shippingAddressPayload = this.createShippingAddressPayload(userDetailsResponse, userAddressPayload);

    const name = first_name + ' ' + last_name;

    const fetchStripePayload = {
      name,
      email,
      ...userAddressPayload,
      ...(address_type === "shipping" ? shippingAddressPayload : {}),
    };

    if (!findStripeVerificationByUserid.data) {
      const response = await this.stripeCustomerService.create(fetchStripePayload);
      return { status: true, data: response};
    } 

    const userId = {
      metadata: {
        user_id: findUser.id,
      },
    };

    const response = await this.stripeCustomerService.update({
      ...fetchStripePayload,
      ...userId
    });

    return {
      status: true,
      data: response,
    };
  }

  private createUserAddressPayload(userDetailsResponse: CreateUserDetailsDto){
    const { city, country, address_one, address_two, postal_code, state } = userDetailsResponse;

    return {
      address: {
        city,
        country,
        line1: address_one,
        line2: address_two,
        postal_code,
        state,
      }
    }
  }

  private createShippingAddressPayload(
    userDetailsResponse: CreateUserDetailsDto, 
    userAddress: stripeUserAddressInterface
  ){
    const {first_name, last_name, phone_number} = userDetailsResponse;

    return {
      shipping: {
        ...userAddress,
        name: first_name + " " + last_name,
        phone: phone_number,
      }
    };
  }

  async updateUsersDetails(updateUserDetailsDto: UpdateUserDetailsDto) {
    const { id, user_id } = updateUserDetailsDto;

    const findUser = await this.findOne(user_id);

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const updateUserDetails = await this.userDetailsRepository.update(
      {
        id,
        user_id,
      },
      updateUserDetailsDto,
    );

    return {
      status: true,
      data: updateUserDetails,
    };
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return this.usersRepository.findOne({
      where: {
        id: id,
      },
      relations: ['user_details'],
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email: email,
      },
    });
  }

  findByPassword(password: string) {
    return this.usersRepository.findOne({
      where: {
        password: password,
      },
    });
  }

  findByToken(token: string) {
    return this.usersRepository.findOne({
      where: {
        remember_token: token,
      },
    });
  }

  async update(id: number, updateUserDto: any) {
    const userEntity = await this.findOne(id);
    await this.usersRepository.save(Object.assign(userEntity, updateUserDto));

    return userEntity;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
