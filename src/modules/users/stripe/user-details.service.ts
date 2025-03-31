import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeCustomerService } from 'src/modules/payments/stripe/customer/customer.service';
import { Users } from 'src/modules/users/entities/users.entity';
import {
  CreateUserDetailsDto,
  stripeUserAddressInterface,
} from 'src/modules/users/dto/create-user.dto';
import { BaseService } from 'src/modules/base/base.service';

@Injectable()
export class UserDetailsStripeService extends BaseService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

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

      const userAddressPayload =
        this.createUserAddressPayload(userDetailsResponse);
      const shippingAddressPayload =
        this.createShippingAddressPayload(userDetailsResponse);

      const name = first_name + ' ' + last_name;

      const fetchStripePayload = {
        name,
        email,
        ...userAddressPayload,
        ...(address_type === 'shipping' ? shippingAddressPayload : {}),
      };

      if (!findStripeVerificationByUserid.data) {
        const response =
          await this.stripeCustomerService.create(fetchStripePayload);
        return { status: true, data: response };
      }

      const userId = {
        metadata: {
          user_id: id,
        },
      };

      const response = await this.stripeCustomerService.update({
        ...fetchStripePayload,
        ...userId,
      });

      return this.createSuccessResponse(response);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private createUserAddressPayload(userDetailsResponse: CreateUserDetailsDto) {
    const { city, country, address_one, address_two, postal_code, state } =
      userDetailsResponse;

    return {
      address: {
        city,
        country,
        line1: address_one,
        line2: address_two,
        postal_code,
        state,
      },
    };
  }

  private createShippingAddressPayload(
    userDetailsResponse: CreateUserDetailsDto,
  ) {
    const userAddressPayload =
      this.createUserAddressPayload(userDetailsResponse);

    const { first_name, last_name, phone_number } = userDetailsResponse;

    return {
      shipping: {
        ...userAddressPayload,
        name: first_name + ' ' + last_name,
        phone: phone_number,
      },
    };
  }
}
