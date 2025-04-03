import { IsNotEmpty } from 'class-validator';

export class CheckoutIdStripeDto {
  @IsNotEmpty()
  checkoutId: string;
}

export class CheckoutLineItemsStripeDto {
  price: {
    product: string;
    unit_amount: number;
  };
  quantity: number;
  amount_subtotal: number;
}
