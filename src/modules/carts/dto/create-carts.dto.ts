import { IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  subtotal: number;

  @IsNotEmpty()
  grand_total: number;
}

export class CreateCartItemsDto {
  @IsNotEmpty()
  product_id: number;

  @IsNotEmpty()
  quantity: number;

  unit_price: number;

  unit_total: number;

  cart_session_id: string;

  @IsNotEmpty()
  user_id: number;

  cart_id: number;
}
