import { IsNotEmpty } from 'class-validator';

export class DeleteCartItemDto {
  @IsNotEmpty()
  cart_id: number;

  @IsNotEmpty()
  product_id: number;
}
