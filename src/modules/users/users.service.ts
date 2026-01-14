import {
  Injectable,
  NotFoundException,
  HttpException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  CreateUserDetailsDto,
  CreateUserAddressDto,
} from './dto/create-user.dto';
import {
  UpdateUserDetailsDto,
  UpdateUserAddressDto,
} from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { Users, UserDetails, UserAddress } from './entities/users.entity';
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

    @InjectRepository(UserAddress)
    private userAddressRepository: Repository<UserAddress>,

    private readonly userDetailsStripeService: UserDetailsStripeService,
  ) {
    super();
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = this.usersRepository.create(createUserDto);
      const findUser = await this.usersRepository.save(user);

      return this.createSuccessResponse(findUser);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      return this.createErrorResponse(error.message);
    }
  }

  async createUsersDetails(createUserDetailsDto: CreateUserDetailsDto) {
    try {
      const {
        user_id,
        address_is_active,
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
        ...userDetailsData
      } = createUserDetailsDto;
      const findUser = await this.findOne(user_id);

      if (!findUser || !findUser.data) {
        throw new NotFoundException('User not found');
      }

      const { id } = findUser.data;

      // Check if user details already exist for this user_id
      const existingUserDetails = await this.userDetailsRepository.findOne({
        where: { user_id: id },
      });

      if (existingUserDetails) {
        throw new BadRequestException(
          'User details already exist for this user',
        );
      }

      const userDetailsResponse = await this.userDetailsRepository.save({
        ...userDetailsData,
        user_id: id,
      });

      // Create user address if address_is_active is true and address fields are provided
      if (
        address_is_active &&
        (address_line_one || address_line_two || address_type || postal_code)
      ) {
        await this.userAddressRepository.save({
          address_line_one: address_line_one || null,
          address_line_two: address_line_two || null,
          address_type: address_type || null,
          postal_code: postal_code || null,
          status: status != null ? Boolean(status) : true,
          user_id: id,
        });
      }

      return this.createSuccessResponse(userDetailsResponse);
    } catch (error) {
      throw error;
    }
  }

  async updateUsersDetails(updateUserDetailsDto: UpdateUserDetailsDto) {
    try {
      const {
        id,
        user_id,
        address_is_active,
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
        ...userDetailsData
      } = updateUserDetailsDto;
      const findUser = await this.findOne(user_id);

      if (!findUser) {
        throw new NotFoundException('User not found');
      }

      const updateUserDetails = await this.userDetailsRepository.update(
        {
          id,
          user_id,
        },
        userDetailsData,
      );

      // Update or create user address if address_is_active is true and address fields are provided
      if (
        address_is_active &&
        (address_line_one ||
          address_line_two ||
          address_type ||
          postal_code ||
          status != null)
      ) {
        const existingAddress = await this.userAddressRepository.findOne({
          where: { user_id },
        });

        const addressUpdateData: Partial<UserAddress> = {};
        if (address_line_one)
          addressUpdateData.address_line_one = address_line_one;
        if (address_line_two)
          addressUpdateData.address_line_two = address_line_two;
        if (address_type) addressUpdateData.address_type = address_type;
        if (postal_code) addressUpdateData.postal_code = postal_code;
        if (status != null) addressUpdateData.status = Boolean(status);

        if (existingAddress) {
          await this.userAddressRepository.update(
            { id: existingAddress.id, user_id },
            addressUpdateData,
          );
        } else {
          await this.userAddressRepository.save({
            address_line_one: address_line_one || null,
            address_line_two: address_line_two || null,
            address_type: address_type || null,
            postal_code: postal_code || null,
            status: status != null ? Boolean(status) : true,
            user_id,
          });
        }
      }

      return this.createSuccessResponse(updateUserDetails);
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  async findByEmail(email: string) {
    try {
      const findEmail = await this.usersRepository.findOne({
        where: {
          email,
        },
        relations: ['user_details'],
      });

      return this.createSuccessResponse(findEmail);
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  async findByResetPasswordToken(token: string) {
    try {
      const findToken = await this.usersRepository.findOne({
        where: {
          reset_password_token: token,
        },
      });

      return this.createSuccessResponse(findToken);
    } catch (error) {
      throw error;
    }
  }

  async update(id: number, updateUserDto: any) {
    try {
      const updateResponse = await this.usersRepository.update(
        {
          id,
        },
        updateUserDto,
      );

      return this.createSuccessResponse(updateResponse);
    } catch (error) {
      throw error;
    }
  }

  async updateByResetPasswordToken(token: string, updateUserDto: any) {
    try {
      const updateResponse = await this.usersRepository.update(
        {
          reset_password_token: token,
        },
        updateUserDto,
      );

      return this.createSuccessResponse(updateResponse);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: number) {
    try {
      const removeUserResponse = await this.usersRepository.delete(id);
      return this.createSuccessResponse(removeUserResponse);
    } catch (error) {
      throw error;
    }
  }

  async createUserAddress(
    user_id: number,
    createUserAddressDto: CreateUserAddressDto,
  ) {
    try {
      const {
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
      } = createUserAddressDto;

      const userAddress = await this.userAddressRepository.save({
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
        user_id,
      });

      return this.createSuccessResponse(userAddress);
    } catch (error) {
      throw error;
    }
  }

  async updateUserAddress(
    user_id: number,
    updateUserAddressDto: UpdateUserAddressDto,
  ) {
    try {
      const {
        id,
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
      } = updateUserAddressDto;

      // Find existing address for this user
      const existingAddress = await this.userAddressRepository.findOne({
        where: { user_id, id },
      });

      if (!existingAddress) {
        throw new NotFoundException('User address not found');
      }

      let addressUpdateData: Partial<UserAddress> = {};

      addressUpdateData = {
        ...addressUpdateData,
        address_line_one,
        address_line_two,
        address_type,
        postal_code,
        status,
      };

      const response = await this.userAddressRepository.update(
        { id: existingAddress.id, user_id },
        addressUpdateData,
      );

      return this.createSuccessResponse(response);
    } catch (error) {
      throw error;
    }
  }

  async deleteUserAddress(user_id: number, id: number) {
    try {
      // Find existing address for this user
      const existingAddress = await this.userAddressRepository.findOne({
        where: { id, user_id },
      });

      if (!existingAddress) {
        throw new NotFoundException('User address not found');
      }

      await this.userAddressRepository.delete({
        id: existingAddress.id,
        user_id,
      });

      return this.createSuccessResponse({
        message: 'User address deleted successfully',
      });
    } catch (error) {
      throw error;
    }
  }

  async listUserAddresses(allUserDto: AllUserDto, user_id: number) {
    try {
      const findAllResponse = await Helper.calculatePagination<UserAddress>(
        allUserDto,
        this.userAddressRepository,
        { user_id },
      );

      return this.createSuccessResponse(findAllResponse);
    } catch (error) {
      throw error;
    }
  }

  async viewUserAddress(id: number) {
    try {
      const address = await this.userAddressRepository.findOne({
        where: { id },
        relations: ['users'],
      });

      if (!address) {
        throw new NotFoundException('User address not found');
      }

      return this.createSuccessResponse(address);
    } catch (error) {
      throw error;
    }
  }
}
