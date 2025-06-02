import { IsEmail, IsNotEmpty, Validate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class signInDto {
  @ApiProperty({
    type: String,
    example: 'admin_one@email.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    example: '1111aaaa',
  })
  @IsNotEmpty()
  password: string;
}
