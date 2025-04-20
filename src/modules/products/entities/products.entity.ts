import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import { Categories } from '../../categories/entities/categories.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { OrderItems } from '../../orders/entities/orders.entity';

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
}
