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
  async updateStripeCheckoutStatus() {
    const BATCH_SIZE = 500;
    let page = 0;

    while (true) {
      const orders = await this.orderRepository.find({
        where: { status: Not('complete') },
        take: BATCH_SIZE,
        skip: page * BATCH_SIZE,
      });

      if (orders.length === 0) break;

      const promiseOrders = orders.map(async (value) => {
        if (!value.checkout_stripe_id) return;

        const stripeSession = await this.stripeService.retrieveStripeCheckout({
          checkoutId: value.checkout_stripe_id,
        });

        await this.orderRepository.update(
          { checkout_stripe_id: value.checkout_stripe_id },
          { status: stripeSession.data.status },
        );
      });

      await Promise.all(promiseOrders);
      page++;
    }

    return { success: true, message: 'Orders sync successfully' };
  }
}
