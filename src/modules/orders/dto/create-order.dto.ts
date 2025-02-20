import {
  IsNotEmpty,
  Validate,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

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
export class CreateOrderDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  status: string;

  subtotal: number;
  grand_total: number;

  @IsNotEmpty()
  shipping_address: string;

  @IsNotEmpty()
  billing_address: string;

  tracking_number: string;

  @IsNotEmpty()
  user_id: number;

  admin_id: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  items: [];

  created_at: Date;
  updated_at: Date;
}
