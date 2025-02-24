import {
  IsNotEmpty,
  IsEmail,
  Validate,
  MaxLength,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { PaymentMethodType } from '../../../../enum/stripe-payment-method.enum';
  

export class CreateStripeDto {
    @IsNotEmpty()
    @IsArray()
    @ArrayNotEmpty()
    payment_method_types: PaymentMethodType;
}
