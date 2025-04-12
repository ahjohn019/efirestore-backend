import { BaseEntity } from '../../base/entities/base.entity';
import { Entity, Column, OneToOne } from 'typeorm';
import { PaymentMethod } from '../../../enum/payment-method.enum';
import { OrderStatus } from '../../../enum/order-status.enum';
import { Orders } from './orders.entity';

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
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @OneToOne(() => Orders, (orders) => orders.refunds)
  orders: Orders;
}
