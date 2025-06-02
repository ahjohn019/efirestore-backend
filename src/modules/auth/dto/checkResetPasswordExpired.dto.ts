import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class checkResetPasswordExpiredDto {
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 1,
  })
  id: number;
}
