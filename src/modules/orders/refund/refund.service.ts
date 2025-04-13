import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseStripeService } from 'src/modules/payments/stripe/base-stripe.service';
import { ConfigService } from '@nestjs/config';
import {
  CheckoutSessionStripeDto,
  RefundOrderDto,
} from '../dto/refund-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRefunds } from '../entities/order-refunds.entity';
import { Not, Repository } from 'typeorm';
import { PaymentMethod } from 'src/enum/payment-method.enum';
import { OrderStatus } from 'src/enum/order-status.enum';
import { Orders } from '../entities/orders.entity';
import { UpdateRefundOrderDto } from '../dto/update-refund-order.dto';

@Injectable()
export class OrderRefundService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    @InjectRepository(Orders)
    private readonly orderRepository: Repository<Orders>,

    @InjectRepository(OrderRefunds)
    private orderRefundRepository: Repository<OrderRefunds>,
  ) {
    super(configService);
  }

  /**
   * Find One Specific Order Refund By Id
   * @param id
   * @returns
   */
  async findOne(id: number) {
    try {
      const orderRefund = await this.orderRefundRepository.findOne({
        where: { id },
        relations: ['orders'],
      });

      if (!orderRefund) {
        throw new NotFoundException('Order refund not found.');
      }

      return this.createSuccessResponse(orderRefund);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Create Order Refund
   * @param refundOrderDto
   * @returns
   */
  async create(refundOrderDto: RefundOrderDto) {
    try {
      const { order_id, reason, method, status } = refundOrderDto;

      const refund: Partial<OrderRefunds> = {
        order_id,
        reason,
        method: method as PaymentMethod,
        status: status as OrderStatus,
      };

      const findOrder = await this.orderRepository.findOne({
        where: { id: order_id },
        relations: ['refunds'],
      });

      if (findOrder.refunds) {
        throw new NotFoundException('Order Refund Exists');
      }

      if (!findOrder) {
        throw new NotFoundException('Order not found.');
      }

      refund.amount = findOrder.grand_total;
      const orderRefundEntity = await this.orderRefundRepository.save(refund);

      return this.createSuccessResponse(orderRefundEntity);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Update refund order
   * @param updateRefundOrderDto
   * @returns
   */
  async update(updateRefundOrderDto: UpdateRefundOrderDto) {
    try {
      const { id, status } = updateRefundOrderDto;

      const refundUpdate: Partial<OrderRefunds> = {
        id,
        status: status as OrderStatus,
      };

      const updateRefundOrder = await this.orderRefundRepository.update(
        { id: refundUpdate.id },
        refundUpdate,
      );

      if (updateRefundOrder.affected) {
        this.stripeRefund(refundUpdate.id);
      }

      return this.createSuccessResponse(updateRefundOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async stripeRefund(refundId: number) {
    const findOrder = await this.findOne(refundId);
    console.log('findOrder', findOrder);

    const stripeCheckoutSessionId = findOrder.data.checkout_stripe_id;

    // const findCheckoutStripeSession =
    //   await this.stripe.checkout.sessions.retrieve(
    //     checkoutSessionStripeDto.checkoutSessionId,
    //   );

    // console.log('findCheckoutStripeSession', findCheckoutStripeSession);
  }
}
