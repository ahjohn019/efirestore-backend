import { IsNotEmpty } from 'class-validator';

export class CheckoutIdStripeDto {
  @IsNotEmpty()
  checkoutId: string;
}
