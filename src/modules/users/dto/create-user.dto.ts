import { IsEmail, IsNotEmpty, Validate } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';
import { MatchPasswords } from '../../../shared/validation/password_matched';

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
