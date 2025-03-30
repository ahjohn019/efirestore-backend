import {
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, CreateUserDetailsDto } from './dto/create-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { UserDetailsStripeService } from 'src/modules/users/stripe/user-details.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    private readonly userDetailsStripeService: UserDetailsStripeService
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
      return this.userDetailsStripeService.syncWithStripeDetails(userDetailsResponse);
    }

    return { status: true, data: userDetailsResponse };
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
