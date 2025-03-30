import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsNotEmpty } from 'class-validator';

import { CreateStripeDto } from './create-stripe.dto';
import { CustomerStripeAddressDto } from './customer-stripe.dto';

export class UpdateStripeDto {
  @IsNotEmpty()
  metadata: {
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
  shipping: {
    address: CustomerStripeAddressDto;
    name: string;
    phone: string;
  };
}
