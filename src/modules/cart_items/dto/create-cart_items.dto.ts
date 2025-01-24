import { IsNotEmpty } from 'class-validator';

export class CreateCartItemsDto {
  @IsNotEmpty()
  product_id: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unit_price: number;

  unit_total: number;

  cart_session_id: string;
}
