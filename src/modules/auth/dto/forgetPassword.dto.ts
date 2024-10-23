import { IsEmail, IsNotEmpty } from 'class-validator';

export class forgetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  url: string;
}
