import { PartialType } from '@nestjs/mapped-types';
import { CreateCartDto } from './create-carts.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {
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
