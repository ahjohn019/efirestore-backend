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
