import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseStripeService } from 'src/modules/payments/stripe/base-stripe.service';
import { ConfigService } from '@nestjs/config';
import { RefundOrderDto } from '../dto/refund-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderRefunds } from '../entities/order-refunds.entity';
import { OrderRefundItems } from '../entities/order-refund-items.entity';
import { Repository } from 'typeorm';
import { PaymentMethod } from 'src/enum/payment-method.enum';
import { OrderStatus } from 'src/enum/order-status.enum';
import { OrderItems, Orders } from '../entities/orders.entity';
import { UpdateRefundOrderDto } from '../dto/update-refund-order.dto';
import { OrderRefundType } from 'src/enum/order-refund-type.enum';

@Injectable()
export class OrderRefundService extends BaseStripeService {
  constructor(
    protected configService: ConfigService,

    @InjectRepository(Orders)
    private readonly orderRepository: Repository<Orders>,

    @InjectRepository(OrderRefunds)
    private orderRefundRepository: Repository<OrderRefunds>,

    @InjectRepository(OrderRefundItems)
    private orderRefundItemRepository: Repository<OrderRefundItems>,
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
      const { order_id, reason, method, status, items } = refundOrderDto;

      // find order refund and get the order by relations
      const orderData = await this.orderRepository.findOne({
        where: {
          id: refundOrderDto.order_id,
        },
        relations: ['refunds', 'items'],
      });

      if (!orderData) {
        throw new NotFoundException('Order Not Found');
      }

      if (orderData.refunds) {
        throw new BadRequestException('Order refund already exists.');
      }

      const mappedOrderItemData = await this.groupOrderRefundItems(
        refundOrderDto,
        orderData,
      );

      const sumOrderRefundItems = mappedOrderItemData.reduce((acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalAmount += item.amount;
        return acc;
      }, {
        totalQuantity: 0,
        totalAmount: 0
      });

      if (sumOrderRefundItems.totalQuantity > orderData.total_quantity) {
        throw new BadRequestException('Refund quantity exceeds order quantity.');
      }

      let refund: Partial<OrderRefunds> = {
        order_id,
        reason,
        method: method as PaymentMethod,
        status: status as OrderStatus,
      };

      refund = {
        ...refund,
        amount: sumOrderRefundItems.totalAmount < orderData.grand_total ? sumOrderRefundItems.totalAmount : orderData.grand_total,
        type: sumOrderRefundItems.totalQuantity < orderData.total_quantity ? OrderRefundType.PARTIAL : OrderRefundType.FULL
      }

      await this.orderRefundRepository.save(refund);
      await this.orderRefundItemRepository.save(mappedOrderItemData);

      const findOrderRefundAfter = await this.orderRefundRepository.findOne({
        where: { order_id: refundOrderDto.order_id }
      });

      return this.createSuccessResponse(findOrderRefundAfter);
    } catch (error) {
      console.log('error', error);
      return this.createErrorResponse(error.message);
    }
  }

  async groupOrderRefundItems(
    refundOrderDto: RefundOrderDto,
    orderData: Orders,
  ) {
    const { items } = orderData;

    return refundOrderDto.items
      .filter((refundItem) =>
        items.some(
          (orderItem) => orderItem.product_id === refundItem.product_id,
        ),
      )
      .map((refundItem) => {
        const matchedOrderItem = items.find(
          (orderItem) => orderItem.product_id === refundItem.product_id,
        );

        return {
          product_id: refundItem.product_id,
          quantity: refundItem.quantity,
          amount: refundItem.quantity * matchedOrderItem.unit_price,
        };
      });
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

      if (!updateRefundOrder.affected) {
        throw new NotFoundException('Updated not found.');
      }

      return this.stripeRefund(refundUpdate.id);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async stripeRefund(refundId: number) {
    try {
      const findOrder = await this.findOne(refundId);

      const stripeCheckoutSessionId = findOrder.data.orders.checkout_stripe_id;

      const findCheckoutStripeSession =
        await this.stripe.checkout.sessions.retrieve(stripeCheckoutSessionId);

      const { payment_intent } = findCheckoutStripeSession;

      if (typeof payment_intent !== 'string' || !payment_intent) {
        throw new BadRequestException('Invalid payment intent.');
      }

      const refundResult = await this.stripe.refunds.create({
        payment_intent,
      });

      return this.createSuccessResponse(refundResult);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}
