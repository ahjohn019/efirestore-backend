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
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethodType } from '../../../../enum/stripe-payment-method.enum';
import { PaymentMode } from '../../../../enum/stripe-payment-mode.enum';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductIdsExists } from 'src/shared/validation/product/is_product_ids_exists';
import { SubmitOrderShipmentDto } from '../../../easyparcel/dto/submit-order.dto';
class ProductDataDto {
  name: string;
  metadata: Record<string, any>;
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
  @Validate(IsDuplicateProducts)
  @Validate(IsProductIdsExists)
  line_items: LineItemsDto[];

  @IsEmail()
  @Validate(IsUserEmail, ['customer_email'])
  customer_email?: string;

  @IsNotEmpty()
  @IsEnum(PaymentMode)
  mode: PaymentMode;

  @IsNotEmpty()
  success_url: string;

  @IsNotEmpty()
  cancel_url: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitOrderShipmentDto)
  easyparcel_shipment?: SubmitOrderShipmentDto[];
}
