import {
  IsNotEmpty,
  IsEmail,
  Validate,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  IsNumber
} from 'class-validator';

export class OrderItemDto{
  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unit_price: number;

  @IsInt()
  @Min(1)
  product_id: number;

  total_price: number;
}

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
  @IsEmail()
  customer_email: string;

  admin_id: number;
  user_id: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  items: OrderItemDto[];

  created_at: Date;
  updated_at: Date;
}
