import { Injectable } from '@nestjs/common';
import { BaseStripeService } from 'src/modules/payments/stripe/base-stripe.service';
import { ConfigService } from '@nestjs/config';
import { CheckoutSessionStripeDto } from '../dto/refund-order.dto';

@Injectable()
export class OrderRefundService extends BaseStripeService {
  constructor(protected configService: ConfigService) {
    super(configService);
  }

  create() {
    return 'Refund order created successfully!';
  }

  async stripeRefund(checkoutSessionStripeDto: CheckoutSessionStripeDto) {
    const findCheckoutStripeSession =
      await this.stripe.checkout.sessions.retrieve(
        checkoutSessionStripeDto.checkoutSessionId,
      );

    console.log('findCheckoutStripeSession', findCheckoutStripeSession);
  }
}
