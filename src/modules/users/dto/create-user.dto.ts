import { IsEmail, IsNotEmpty, Validate } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';
import { MatchPasswords } from '../../../shared/validation/password_matched';
import { Gender } from '../../../enum/gender.enum';

export class CreateUserDetailsDto {
  @IsNotEmpty()
  first_name: string;

  @IsNotEmpty()
  last_name: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  country: string;

  phone_number: string;

  identity_card_number: string;

  gender: Gender;

  user_id: number;

  // addresses
  address_is_active?: boolean;
  address_line_one?: string;
  address_line_two?: string;
  address_type?: string;
  postal_code?: number;
  status?: number;
}

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @Validate(IsUnique, ['users', 'email'])
  email: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @Validate(MatchPasswords, ['password'])
  password_confirmation: string;
}

export class CreateUserAddressDto {
  @IsNotEmpty()
  address_line_one: string;

  address_line_two: string;

  @IsNotEmpty()
  address_type: string;

  @IsNotEmpty()
  postal_code: number;
  @IsNotEmpty()
  status: boolean;
}
