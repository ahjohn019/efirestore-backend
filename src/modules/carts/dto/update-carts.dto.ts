import { IsNotEmpty } from 'class-validator';

export class UpdateCartDto {
  @IsNotEmpty()
  user_id: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  subtotal: number;

  @IsNotEmpty()
  grand_total: number;

  cart_session_id: string;
}
