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
import { Products } from '../../products/entities/products.entity';

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
  total_quantity: number;

  @Column()
  remarks: string;

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

  @OneToMany(() => OrderItems, (orderItems) => orderItems.orders, {
    cascade: true,
  })
  items: OrderItems[];

  @ManyToOne(() => Users, (users) => users.orders, {
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @OneToOne(() => OrderRefunds, (orderRefunds) => orderRefunds.orders)
  refunds: OrderRefunds;

  @Column()
  checkout_stripe_id: string;

  @Column()
  stripe_sync: number;
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

  @OneToOne(() => Products, (product) => product.order_item, { eager: true })
  @JoinColumn({ name: 'product_id' })
  product: Products;
}
