import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OrderItems } from '../../order_items/entities/order_items.entity';
import * as dayjs from 'dayjs';

@Entity()
export class Orders {
  @PrimaryGeneratedColumn()
  id: number;

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

  @Column()
  user_id: number;

  @Column()
  admin_id: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updated_at: Date;

  @OneToMany(() => OrderItems, (orderItems) => orderItems.orders, {
    cascade: true,
  })
  items: OrderItems[];
}
