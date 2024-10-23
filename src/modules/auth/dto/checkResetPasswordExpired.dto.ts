import { IsNotEmpty } from 'class-validator';

export class checkResetPasswordExpiredDto {
  @IsNotEmpty()
  id: number;
}
