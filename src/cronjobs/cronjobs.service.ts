import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Orders } from '../modules/orders/entities/orders.entity';
import { Repository, Not } from 'typeorm';
import { StripeService } from '../modules/payments/stripe/stripe.service';

@Injectable()
export class CronjobsService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    private readonly stripeService: StripeService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateStripeCheckout() {
    const findCheckoutStripe = await this.orderRepository.find({
      where: {
        status: Not('complete'),
      },
    });

    const checkoutStripeIdMapped = findCheckoutStripe.map((value) => {
      return value.checkout_stripe_id;
    });

    for (const checkoutId of checkoutStripeIdMapped) {
      if (!checkoutId) continue;

      const findStripeCheckout =
        await this.stripeService.retrieveStripeCheckout({
          checkoutId,
        });

      await this.orderRepository.update(
        { checkout_stripe_id: checkoutId },
        { status: findStripeCheckout.data.status },
      );
    }

    return { success: true, message: 'Orders sync successfully' };
  }
}
