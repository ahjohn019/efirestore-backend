import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteCartItemDto {
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 2,
  })
  cart_id: number;

  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 1,
  })
  product_id: number;
}
