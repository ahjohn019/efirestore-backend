import { IsEmail, IsNotEmpty } from 'class-validator';

export class CustomerStripeAddressDto {
  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  country: string;

  @IsNotEmpty()
  line1: string;

  @IsNotEmpty()
  line2: string;

  @IsNotEmpty()
  postal_code: string;

  @IsNotEmpty()
  state: string;
}

export class CustomerStripeDto {
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
