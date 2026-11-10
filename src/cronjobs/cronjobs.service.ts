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
