import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Orders } from '../../orders/entities/orders.entity';
import * as dayjs from 'dayjs';

@Entity()
export class OrderItems {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @BeforeInsert()
  setDefaultDates() {
    const currentDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    this.created_at = new Date(currentDate);
    this.updated_at = new Date(currentDate);
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }

  @ManyToOne(() => Orders, (orders) => orders.items, {
    eager: true,
  })
  @JoinColumn({ name: 'order_id' })
  orders: Orders;
}
