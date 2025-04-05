import { IsNotEmpty } from 'class-validator';

export class CheckoutIdStripeDto {
  @IsNotEmpty()
  checkoutId: string;
}

export interface CheckoutLineItemsStripeDto {
  price: {
    product: string;
    unit_amount: number;
  };
  quantity: number;
  amount_subtotal: number;
}
