import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemsDto {
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 2,
  })
  product_id: number;

  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 1,
  })
  quantity: number;

  unit_price: number;

  unit_total: number;

  cart_session_id: string;

  cart_id: number;

  user_id: number;
}
