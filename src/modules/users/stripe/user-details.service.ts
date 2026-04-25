import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StripeCustomerService } from 'src/modules/payments/stripe/customer/customer.service';
import { Users } from 'src/modules/users/entities/users.entity';
import { UserAddress } from 'src/modules/users/entities/user-address.entity';
import { UserDetails } from 'src/modules/users/entities/user-details.entity';
import { CreateUserDetailsDto } from 'src/modules/users/dto/create-user.dto';
import { BaseService } from 'src/modules/base/base.service';
import { AddressType } from 'src/enum/address-type.enum';
import {
  CustomerStripeAddressDto,
  CustomerStripeDto,
} from 'src/modules/payments/stripe/dto/customer-stripe.dto';
import { UpdateStripeDto } from 'src/modules/payments/stripe/dto/update-stripe.dto';

type StripeCustomerSyncPayload = {
  name: string;
  email: string;
  address?: CustomerStripeAddressDto;
  shipping?: CustomerStripeDto['shipping'];
};

type ActiveAddressMap = {
  billing?: UserAddress;
  shipping?: UserAddress;
};

@Injectable()
export class UserDetailsStripeService extends BaseService {
  private readonly logger = new Logger(UserDetailsStripeService.name);

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
      const { user_id } = userDetailsResponse;

      this.logger.log(`Preparing Stripe customer sync for user_id=${user_id}`);

      const findUser = await this.usersRepository.findOne({
        where: { id: user_id },
      });

      if (!findUser) {
        this.logger.warn(
          `Cannot prepare Stripe customer sync for user_id=${user_id}: user not found`,
        );
        return 'User not found.';
      }

      const { email, id } = findUser;

      const findStripeVerificationByUserid =
        await this.stripeCustomerService.show(user_id);

      if (findStripeVerificationByUserid.status === 'error') {
        this.logger.error(
          `Failed to retrieve Stripe customer for user_id=${user_id}: ${findStripeVerificationByUserid.data}`,
        );
        return findStripeVerificationByUserid;
      }

      const addressData = await this.resolveAddressData(userDetailsResponse);
      const fetchStripePayload = await this.createStripeCustomerSyncPayload(
        addressData,
        email,
      );

      this.logger.log(
        `Stripe payload prepared for user_id=${user_id}: hasBilling=${Boolean(
          fetchStripePayload.address,
        )} hasShipping=${Boolean(fetchStripePayload.shipping)} email=${email}`,
      );

      if (!findStripeVerificationByUserid.data) {
        this.logger.log(
          `Creating Stripe customer for user_id=${user_id}: no existing stripe_users record/customer found`,
        );

        const createResponse = await this.stripeCustomerService.create(
          fetchStripePayload as CustomerStripeDto,
        );

        this.logStripeSyncResponse('create', user_id, createResponse);

        return createResponse;
      }

      const userId = {
        metadata: {
          user_id: id,
        },
      };

      this.logger.log(`Updating Stripe customer for user_id=${user_id}`);

      const updateResponse = await this.stripeCustomerService.update({
        ...fetchStripePayload,
        ...userId,
      } as UpdateStripeDto);

      this.logStripeSyncResponse('update', user_id, updateResponse);

      return updateResponse;
    } catch (error) {
      this.logger.error(
        `Unexpected Stripe customer sync error for user_id=${userDetailsResponse.user_id}: ${error.message}`,
        error.stack,
      );
      return error.message;
    }
  }

  private async resolveAddressData(
    userDetailsResponse: CreateUserDetailsDto,
  ): Promise<CreateUserDetailsDto> {
    const { user_id } = userDetailsResponse;
    let addressData = userDetailsResponse;

    if (!addressData.city || !addressData.state || !addressData.country) {
      const userDetails = await this.userDetailsRepository.findOne({
        where: { user_id },
        order: { id: 'DESC' },
      });

      if (userDetails) {
        addressData = {
          ...addressData,
          city: addressData.city || userDetails.city,
          state: addressData.state || userDetails.state,
          country: addressData.country || userDetails.country,
        };
      }
    }

    if (addressData.address_line_one || addressData.address_line_two) {
      return addressData;
    }

    const fallbackAddress = await this.userAddressRepository.findOne({
      where: { user_id },
      order: { id: 'DESC' },
    });

    return fallbackAddress
      ? this.mergeAddressData(addressData, fallbackAddress)
      : addressData;
  }

  private async createStripeCustomerSyncPayload(
    addressData: CreateUserDetailsDto,
    email: string,
  ): Promise<StripeCustomerSyncPayload> {
    const { first_name, last_name, user_id } = addressData;
    const activeAddresses = await this.getActiveAddressMap(user_id);
    const payload: StripeCustomerSyncPayload = {
      name: `${first_name} ${last_name}`,
      email,
    };

    if (
      activeAddresses.billing ||
      addressData.address_type === AddressType.BILLING
    ) {
      payload.address = this.createStripeAddress(
        activeAddresses.billing
          ? this.mergeAddressData(addressData, activeAddresses.billing)
          : addressData,
      );
    }

    if (
      activeAddresses.shipping ||
      addressData.address_type === AddressType.SHIPPING
    ) {
      payload.shipping = this.createStripeShipping(
        activeAddresses.shipping
          ? this.mergeAddressData(addressData, activeAddresses.shipping)
          : addressData,
      );
    }

    this.logger.log(
      `Stripe payload prepared for user_id=${user_id}: hasBilling=${Boolean(
        payload.address,
      )} hasShipping=${Boolean(payload.shipping)} activeBilling=${Boolean(
        activeAddresses.billing,
      )} activeShipping=${Boolean(activeAddresses.shipping)}`,
    );

    return payload;
  }

  private async getActiveAddressMap(
    user_id: number,
  ): Promise<ActiveAddressMap> {
    const activeAddresses = await this.userAddressRepository.find({
      where: {
        user_id,
        status: true,
      },
    });

    this.logger.log(
      `Found ${activeAddresses.length} active user address(es) for Stripe sync user_id=${user_id}: types=${activeAddresses
        .map((userAddress) => userAddress.address_type)
        .join(',')}`,
    );

    return {
      billing: this.findAddressByType(activeAddresses, AddressType.BILLING),
      shipping: this.findAddressByType(activeAddresses, AddressType.SHIPPING),
    };
  }

  private logStripeSyncResponse(
    action: 'create' | 'update',
    user_id: number,
    response: any,
  ) {
    if (response?.status === 'success') {
      const stripeCustomerId =
        response.data?.id || response.data?.stripe_account_id || 'unknown';

      this.logger.log(
        `Stripe customer ${action} successful for user_id=${user_id}: stripe_customer_id=${stripeCustomerId}`,
      );
      return;
    }

    this.logger.error(
      `Stripe customer ${action} failed for user_id=${user_id}: ${
        response?.data || response
      }`,
    );
  }

  private findAddressByType(
    userAddresses: UserAddress[],
    addressType: AddressType,
  ): UserAddress | undefined {
    return userAddresses.find(
      (userAddress) => userAddress.address_type === addressType,
    );
  }

  private createStripeAddress(
    userDetailsResponse: CreateUserDetailsDto,
  ): CustomerStripeAddressDto {
    const {
      city,
      country,
      address_line_one,
      address_line_two,
      postal_code,
      state,
    } = userDetailsResponse;

    return {
      city: city || '',
      country: country || '',
      line1: address_line_one || '',
      line2: address_line_two || '',
      postal_code: postal_code ? String(postal_code) : '',
      state: state || '',
    };
  }

  private mergeAddressData(
    userDetailsResponse: CreateUserDetailsDto,
    userAddress: UserAddress,
  ): CreateUserDetailsDto {
    return {
      ...userDetailsResponse,
      address_line_one: userAddress.address_line_one,
      address_line_two: userAddress.address_line_two,
      postal_code: userAddress.postal_code,
      address_type: userAddress.address_type,
    };
  }

  private createStripeShipping(
    userDetailsResponse: CreateUserDetailsDto,
  ): CustomerStripeDto['shipping'] {
    const { first_name, last_name, phone_number } = userDetailsResponse;

    return {
      address: this.createStripeAddress(userDetailsResponse),
      name: `${first_name} ${last_name}`,
      phone: phone_number || '',
    };
  }
}
