import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, CreateUserDetailsDto } from './dto/create-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { UserDetailsStripeService } from 'src/modules/users/stripe/user-details.service';
import { BaseService } from 'src/modules/base/base.service'

@Injectable()
export class UsersService extends BaseService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    private readonly userDetailsStripeService: UserDetailsStripeService,
  ) {
    super()
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.usersRepository.create(createUserDto);
      return this.createSuccessResponse(user);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async createUsersDetails(createUserDetailsDto: CreateUserDetailsDto) {
    try {
      const { user_id } = createUserDetailsDto;
      const findUser = await this.findOne(user_id);
      const { id } = findUser.data;

      if (!findUser) {
        throw new NotFoundException('User not found');
      }

      const userDetailsResponse = await this.userDetailsRepository.save({
        ...createUserDetailsDto,
        user_id: id,
      });

      const { stripe_verification, is_default } = userDetailsResponse;

      if (stripe_verification && is_default) {
        return this.userDetailsStripeService.syncWithStripeDetails(
          userDetailsResponse,
        );
      }

      return this.createSuccessResponse(userDetailsResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async updateUsersDetails(updateUserDetailsDto: UpdateUserDetailsDto) {
    try {
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

      return this.createSuccessResponse(updateUserDetails);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    try {
      const findUser = await this.usersRepository.findOne({
        where: {
          id,
        },
        relations: ['user_details'],
      });

      return this.createSuccessResponse(findUser);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findByEmail(email: string) {
    try {
      const findEmail = await this.usersRepository.findOne({
        where: {
          email: email,
        },
      });

      return this.createSuccessResponse(findEmail);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  findByPassword(password: string) {
    try {
      const findPassword = this.usersRepository.findOne({
        where: {
          password: password
        },
      });

      return this.createSuccessResponse(findPassword);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  findByToken(token: string) {
    try {
      const findToken = this.usersRepository.findOne({
        where: {
          remember_token: token
        },
      });

      return this.createSuccessResponse(findToken);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async update(id: number, updateUserDto: any) {
    try {
      const userEntity = await this.findOne(id);
      const updateResponse = await this.usersRepository.save(Object.assign(userEntity, updateUserDto));

      return this.createSuccessResponse(updateResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
