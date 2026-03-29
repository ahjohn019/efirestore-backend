import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Orders } from '../modules/orders/entities/orders.entity';
import { Repository, Not, LessThan } from 'typeorm';
import { StripeService } from '../modules/payments/stripe/stripe.service';
import { Carts } from '../modules/carts/entities/carts.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class CronjobsService {
  private static readonly CART_EXPIRATION_HOURS = 24;

  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,

    private readonly stripeService: StripeService,
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

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredCarts() {
    const expiredAt = dayjs()
      .subtract(CronjobsService.CART_EXPIRATION_HOURS, 'hour')
      .toDate();

    const expiredCarts = await this.cartsRepository.find({
      where: {
        updated_at: LessThan(expiredAt),
      },
      select: ['id'],
    });

    if (expiredCarts.length === 0) {
      return { success: true, message: 'No expired carts found.' };
    }

    await this.cartsRepository.delete(expiredCarts.map((cart) => cart.id));

    return {
      success: true,
      message: `${expiredCarts.length} expired carts removed successfully`,
    };
  }
}
