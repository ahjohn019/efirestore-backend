import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import { Categories } from '../../categories/entities/categories.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { OrderItems } from '../../orders/entities/orders.entity';
import { CartItems } from '../../carts/entities/carts.entity';
import { OrderRefundItems } from '../../orders/entities/order-refund-items.entity';

@Entity()
export class Products extends BaseEntity {
  @IsNotEmpty()
  @Column()
  title: string;

  @IsNotEmpty()
  @Column()
  sku: string;

  @Column()
  description: string;

  @IsNotEmpty()
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  width: number;

  @Column({ type: 'int', default: 0 })
  height: number;

  @Column({ type: 'int', default: 0 })
  length: number;

  @Column({ type: 'int', default: 0 })
  weight: number;

  @Column({ type: 'int', nullable: true })
  category_id: number | null;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Categories, (categories) => categories.products, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  categories: Categories;

  @OneToOne(() => OrderItems, (orderItems) => orderItems.product)
  order_item: OrderItems;

  @OneToOne(
    () => OrderRefundItems,
    (order_refund_item) => order_refund_item.product,
  )
  order_refund_item: OrderRefundItems;

  @OneToMany(() => CartItems, (cartItem) => cartItem.product)
  cart_items: CartItems[];
}
