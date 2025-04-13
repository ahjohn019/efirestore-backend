import { IsNotEmpty, IsEnum } from 'class-validator';
import { PaymentMethod } from '../../../enum/payment-method.enum';
import { OrderStatus } from '../../../enum/order-status.enum';

export class RefundOrderDto {
  @IsNotEmpty()
  order_id: number;

  @IsNotEmpty()
  reason: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  method: string;

  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: string;
}

export interface CheckoutSessionStripeDto {
  checkoutSessionId: string;
}
