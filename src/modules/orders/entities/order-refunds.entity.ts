import { BaseEntity } from '../../base/entities/base.entity';
import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { PaymentMethod } from '../../../enum/payment-method.enum';
import { OrderStatus } from '../../../enum/order-status.enum';
import { Orders } from './orders.entity';
import { OrderRefundItems } from './order-refund-items.entity';
import { OrderRefundType } from '../../../enum/order-refund-type.enum';

@Entity()
export class OrderRefunds extends BaseEntity {
  @Column()
  order_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column()
  reason: string;

  @Column({
    type: 'enum',
    enum: OrderRefundType
  })
  type: OrderRefundType;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @OneToOne(() => Orders, (orders) => orders.refunds)
  @JoinColumn({ name: 'order_id' })
  orders: Orders;

  @OneToMany(() => OrderRefundItems, (order_refund_items) => order_refund_items.order_refund)
  order_refund_items: OrderRefundItems;
}
