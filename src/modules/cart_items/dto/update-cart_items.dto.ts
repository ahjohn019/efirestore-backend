import { PartialType } from '@nestjs/mapped-types';
import { CreateCartItemsDto } from './create-cart_items.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateCartItemsDto extends PartialType(CreateCartItemsDto) {
  @IsNotEmpty()
  cart_session_id: string;

  @IsNotEmpty()
  product_id: number;

  @IsNotEmpty()
  quantity: number;
}
