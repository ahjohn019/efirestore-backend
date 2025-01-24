import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import * as dayjs from 'dayjs';
import { Carts } from '../../carts/entities/carts.entity';

@Entity()
export class CartItems {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNotEmpty()
  @Column()
  quantity: number;

  @IsNotEmpty()
  @Column('decimal', { precision: 10, scale: 2 })
  unit_price: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unit_total: number;

  @Column()
  cart_session_id: string;

  @Column()
  product_id: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Carts, (cart) => cart.cart_items, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'cart_session_id' })
  cart: Carts;

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
}
