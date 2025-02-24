import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Users } from '../../users/entities/users.entity';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
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
}

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

