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
  address_one: string;

  @IsNotEmpty()
  address_two: string;

  @IsNotEmpty()
  postal_code: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  state: string;

  @IsNotEmpty()
  country: string;

  @IsNotEmpty()
  address_type: string;

  @IsNotEmpty()
  is_default: number;

  phone_number: string;

  identity_card_number: string;

  gender: Gender;
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
