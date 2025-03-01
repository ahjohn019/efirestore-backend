import {
  IsNotEmpty,
  IsEmail,
  Validate,
  MaxLength,
  IsArray,
  IsInt,
  ArrayNotEmpty,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodType } from '../../../../enum/stripe-payment-method.enum';
import { PaymentMode } from '../../../../enum/stripe-payment-mode.enum';

class ProductDataDto {
  name: string;
  metadata: Record<string, any>
}
class LineItemsPriceDataDto {
  currency: string;
  product_data: ProductDataDto;
  unit_amount: number;
}
class LineItemsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => LineItemsPriceDataDto)
  price_data: LineItemsPriceDataDto;

  @IsNotEmpty()
  @IsInt()
  quantity: number;
}
export class CreateStripeDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsEnum(PaymentMethodType, { each: true })
    payment_method_types: PaymentMethodType[];

    @ArrayNotEmpty()
    @IsArray()
    @ValidateNested()
    @Type(() => LineItemsDto)
    line_items: LineItemsDto[];

    @IsEmail()
    customer_email: string;

    @IsNotEmpty()
    @IsEnum(PaymentMode)
    mode: PaymentMode;

    @IsNotEmpty()
    success_url: string;

    @IsNotEmpty()
    cancel_url: string;
}
