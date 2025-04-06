import {
  IsNotEmpty,
  IsEmail,
  Validate,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  Min,
  IsNumber,
} from 'class-validator';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductIdsExists } from 'src/shared/validation/product/is_product_ids_exists';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';

export class OrderItemDto {
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

  @IsNotEmpty()
  shipping_address: string;

  @IsNotEmpty()
  billing_address: string;

  @IsNotEmpty()
  @IsEmail()
  @Validate(IsUserEmail, ['customer_email'])
  customer_email: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @Validate(IsDuplicateProducts)
  @Validate(IsProductIdsExists)
  items: OrderItemDto[];

  created_at: Date;
  updated_at: Date;

  subtotal: number;
  grand_total: number;

  admin_id: number;
  user_id: number;

  tracking_number: string;
}

export interface orderItemTotalPrice {
  unit_price: number;
  quantity: number;
}
