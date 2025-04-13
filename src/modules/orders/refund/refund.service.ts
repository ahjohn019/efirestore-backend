import { Injectable } from '@nestjs/common';
import { BaseStripeService } from 'src/modules/payments/stripe/base-stripe.service';
import { ConfigService } from '@nestjs/config';
import {
  CheckoutSessionStripeDto,
  RefundOrderDto,
} from '../dto/refund-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRefunds } from '../entities/order-refunds.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderRefundService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    @InjectRepository(OrderRefunds)
    private orderRefundRepository: Repository<OrderRefunds>,
  ) {
    super(configService);
  }

  create(refundOrderDto: RefundOrderDto) {
    const findOrderRefund = this.orderRefundRepository.findOne({
      where: { id: refundOrderDto.order_id },
    });

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
