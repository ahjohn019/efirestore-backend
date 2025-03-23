import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, CreateUserDetailsDto } from './dto/create-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { StripeService } from 'src/modules/payments/stripe/stripe.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    @Inject(forwardRef(() => StripeService))
    private readonly stripeService: StripeService,
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
    const findUser = await this.usersRepository.findOne({
      where: {
        id: createUserDetailsDto.user_id,
      },
    });

    let response = null;

    if (!findUser) {
      throw new NotFoundException('User not found');
    }

    const findUserDetails = await this.userDetailsRepository.findOne({
      where: {
        user_id: createUserDetailsDto.user_id,
      },
    });

    if (findUserDetails) {
      response = await this.userDetailsRepository.update(
        { user_id: createUserDetailsDto.user_id },
        createUserDetailsDto,
      );

      return {
        status: true,
        data: response,
      };
    }

    response = await this.userDetailsRepository.save(createUserDetailsDto);

    return {
      status: true,
      data: response,
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
