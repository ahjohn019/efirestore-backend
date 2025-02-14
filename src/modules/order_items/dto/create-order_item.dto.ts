import { IsNotEmpty, Validate, MaxLength } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unit_price: number;

  @IsNotEmpty()
  total_price: number;

  @IsNotEmpty()
  product_id: number;

  @IsNotEmpty()
  order_id: number;
}
