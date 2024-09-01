import { IsEmail, IsNotEmpty, Validate } from 'class-validator';

export class signInDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
