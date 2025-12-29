import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Orders } from '../modules/orders/entities/orders.entity';
import { Repository, Not } from 'typeorm';
import { StripeService } from '../modules/payments/stripe/stripe.service';
import { CartsService } from 'src/modules/carts/carts.service';

@Injectable()
export class CronjobsService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    private readonly stripeService: StripeService,

    private readonly cartsService: CartsService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateStripeCheckoutStatus() {
    const BATCH_SIZE = 500;
    let page = 0;

    while (true) {
      const orders = await this.orderRepository.find({
        take: BATCH_SIZE,
        skip: page * BATCH_SIZE,
      });

      const countOrderIncomplete = await this.orderRepository.count({
        where: { status: Not('complete') },
      });

      if (orders.length === 0 || countOrderIncomplete === 0) break;

      const promiseOrders = orders.map(async (value) => {
        if (!value.checkout_stripe_id) return;

        const findCart = await this.cartsService.findCartByUserId(
          value.user_id,
        );

        if (value.status === 'complete' && findCart) {
          return await this.cartsService.deleteCart(value.user_id);
        }

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
