import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class checkResetPasswordExpiredDto {
  @IsNotEmpty()
  @ApiProperty({
    type: String,
    example: '$2b$10$resetPasswordToken',
  })
  reset_password_token: string;
}
