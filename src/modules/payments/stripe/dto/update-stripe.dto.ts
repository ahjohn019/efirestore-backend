import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty } from 'class-validator';

import { CreateStripeDto } from './create-stripe.dto';
import {
  CustomerStripeAddressDto,
  CustomerStripeDto,
} from './customer-stripe.dto';

export class UpdateStripeDto extends CustomerStripeDto {
  @IsNotEmpty()
  metadata?: {
    user_id: number;
  };

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  address: CustomerStripeAddressDto;

  @IsNotEmpty()
  shipping?: {
    address: CustomerStripeAddressDto;
    name: string;
    phone: string;
  };
}

export class UpdateCheckoutStripeDto {
  @IsNotEmpty()
  order_id: number;
}
