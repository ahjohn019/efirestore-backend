import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class LoginEasyparcelDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
