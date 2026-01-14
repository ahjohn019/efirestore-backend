import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeCustomerService } from 'src/modules/payments/stripe/customer/customer.service';
import { Users, UserAddress, UserDetails } from 'src/modules/users/entities/users.entity';
import { CreateUserDetailsDto } from 'src/modules/users/dto/create-user.dto';
import { BaseService } from 'src/modules/base/base.service';

@Injectable()
export class UserDetailsStripeService extends BaseService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(UserAddress)
    private userAddressRepository: Repository<UserAddress>,

    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,

    private readonly stripeCustomerService: StripeCustomerService,
  ) {
    super();
  }

  async syncWithStripeDetails(userDetailsResponse: CreateUserDetailsDto) {
    try {
      const { first_name, last_name, address_type, user_id } =
        userDetailsResponse;

      const findUser = await this.usersRepository.findOne({
        where: { id: user_id },
      });

      const { email, id } = findUser;

      const findStripeVerificationByUserid =
        await this.stripeCustomerService.show(user_id);

      // Fetch address and user details from database if not in DTO
      let addressData = userDetailsResponse;
      
      // Get user details if city, state, or country are missing
      if (!userDetailsResponse.city || !userDetailsResponse.state || !userDetailsResponse.country) {
        const userDetails = await this.userDetailsRepository
          .createQueryBuilder('userDetails')
          .where('userDetails.user_id = :user_id', { user_id })
          .orderBy('userDetails.id', 'DESC')
          .getOne();
        
        if (userDetails) {
          addressData = {
            ...addressData,
            city: addressData.city || userDetails.city,
            state: addressData.state || userDetails.state,
            country: addressData.country || userDetails.country,
          };
        }
      }
      
      // Get address from user_addresses table if address fields are missing
      if (!userDetailsResponse.address_line_one && !userDetailsResponse.address_line_two) {
        const userAddress = await this.userAddressRepository
          .createQueryBuilder('userAddress')
          .where('userAddress.user_id = :user_id', { user_id })
          .orderBy('userAddress.id', 'DESC')
          .getOne();
        
        if (userAddress) {
          addressData = {
            ...addressData,
            address_line_one: userAddress.address_line_one,
            address_line_two: userAddress.address_line_two,
            postal_code: userAddress.postal_code,
            address_type: addressData.address_type || userAddress.address_type || address_type,
          };
        }
      }

      const userAddressPayload =
        this.createUserAddressPayload(addressData);
      const shippingAddressPayload =
        this.createShippingAddressPayload(addressData);

      const name = first_name + ' ' + last_name;

      const fetchStripePayload = {
        name,
        email,
        ...userAddressPayload,
        ...(address_type === 'shipping' ? shippingAddressPayload : {}),
      };

      if (!findStripeVerificationByUserid.data) {
        return await this.stripeCustomerService.create(fetchStripePayload);
      }

      const userId = {
        metadata: {
          user_id: id,
        },
      };

      return await this.stripeCustomerService.update({
        ...fetchStripePayload,
        ...userId,
      });
    } catch (error) {
      return error.message;
    }
  }

  private createUserAddressPayload(userDetailsResponse: CreateUserDetailsDto) {
    const { city, country, address_line_one, address_line_two, postal_code, state } =
      userDetailsResponse;

    // Convert postal_code to string if it's a number
    const postalCodeString = postal_code ? String(postal_code) : '';

    return {
      address: {
        city: city || '',
        country: country || '',
        line1: address_line_one || '',
        line2: address_line_two || '',
        postal_code: postalCodeString,
        state: state || '',
      },
    };
  }

  private createShippingAddressPayload(
    userDetailsResponse: CreateUserDetailsDto,
  ) {
    const { city, country, address_line_one, address_line_two, postal_code, state } =
      userDetailsResponse;
    const { first_name, last_name, phone_number } = userDetailsResponse;

    // Convert postal_code to string if it's a number
    const postalCodeString = postal_code ? String(postal_code) : '';

    return {
      shipping: {
        address: {
          city: city || '',
          country: country || '',
          line1: address_line_one || '',
          line2: address_line_two || '',
          postal_code: postalCodeString,
          state: state || '',
        },
        name: first_name + ' ' + last_name,
        phone: phone_number || '',
      },
    };
  }
}
