import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class forgetPasswordDto {
  @ApiProperty({
    type: String,
    example: 'user_one@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
