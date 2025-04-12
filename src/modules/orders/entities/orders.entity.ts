import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { OrderRefunds } from './order-refunds.entity';

@Entity()
export class Orders extends BaseEntity {
  @Column()
  title: string;

  @Column()
  status: string;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column('decimal', { precision: 10, scale: 2 })
  grand_total: number;

  @Column()
  shipping_address: string;

  @Column()
  billing_address: string;

  @Column()
  tracking_number: string;

  @Column()
  remarks: string;

  @OneToMany(() => OrderItems, (orderItems) => orderItems.orders, {
    cascade: true,
  })
  items: OrderItems[];

  @ManyToOne(() => Users, (users) => users.orders, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Users, (users) => users.orders, {
    eager: true,
  })
  @JoinColumn({ name: 'admin_id' })
  admin: Users;

  @Column()
  user_id: number;

  @Column()
  admin_id: number;
  total_price: number;

  @OneToOne(() => OrderRefunds, (orderRefunds) => orderRefunds.orders)
  @JoinColumn({ name: 'order_id' })
  refunds: OrderRefunds;
}

@Entity()
export class OrderItems extends BaseEntity {
  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_price: number;

  @Column()
  product_id: number;

  @Column()
  order_id: number;

  @ManyToOne(() => Orders, (orders) => orders.items, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  orders: Orders;
}
