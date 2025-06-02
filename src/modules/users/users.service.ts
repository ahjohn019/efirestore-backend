import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, CreateUserDetailsDto } from './dto/create-user.dto';
import { UpdateUserDetailsDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails } from './entities/users.entity';
import { UserDetailsStripeService } from 'src/modules/users/stripe/user-details.service';
import { BaseService } from 'src/modules/base/base.service';
import { Helper } from '../../utils/helper';
import { AllUserDto } from './dto/all-user.dto';
import { Gender } from 'src/enum/gender.enum';

@Injectable()
export class UsersService extends BaseService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    private readonly userDetailsStripeService: UserDetailsStripeService,
  ) {
    super();
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

      const { is_default } = userDetailsResponse;

      if (is_default) {
        return await this.userDetailsStripeService.syncWithStripeDetails(
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

      const findUserDetails = await this.userDetailsRepository.findOne({
        where: { id },
      });

      const { is_default } = findUserDetails;

      if (is_default) {
        const userDetailsDto: CreateUserDetailsDto = {
          ...findUserDetails,
          gender: findUserDetails.gender as Gender,
        };
        return await this.userDetailsStripeService.syncWithStripeDetails(
          userDetailsDto,
        );
      }

      return this.createSuccessResponse(updateUserDetails);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findAll(allUserDto: AllUserDto) {
    try {
      const findAllResponse = await Helper.calculatePagination<Users>(
        allUserDto,
        this.usersRepository,
        null,
      );

      return this.createSuccessResponse(findAllResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findOne(id: number) {
    try {
      const findUser = await this.usersRepository.findOne({
        where: {
          id,
        },
        relations: ['user_details', 'orders', 'stripe_users'],
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

  async findByPassword(password: string) {
    try {
      const findPassword = await this.usersRepository.findOne({
        where: {
          password: password,
        },
      });

      return this.createSuccessResponse(findPassword);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async findByToken(token: string) {
    try {
      const findToken = await this.usersRepository.findOne({
        where: {
          remember_token: token,
        },
      });

      return this.createSuccessResponse(findToken);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async update(id: number, updateUserDto: any) {
    try {
      // const userEntity = await this.findOne(id);
      // const updateResponse = await this.usersRepository.save(
      //   Object.assign(userEntity, updateUserDto),
      // );

      const updateResponse = await this.usersRepository.update(
        {
          id,
        },
        updateUserDto,
      );

      return this.createSuccessResponse(updateResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async remove(id: number) {
    try {
      const removeUserResponse = await this.usersRepository.delete(id);
      return this.createSuccessResponse(removeUserResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}
