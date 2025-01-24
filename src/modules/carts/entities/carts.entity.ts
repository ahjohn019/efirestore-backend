import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import * as dayjs from 'dayjs';
import { CartItems } from '../../cart_items/entities/cart_items.entity';
import { Users } from '../../users/entities/users.entity';

@Entity()
export class Carts {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNotEmpty()
  @Column()
  quantity: number;

  @IsNotEmpty()
  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @IsNotEmpty()
  @Column('decimal', { precision: 10, scale: 2 })
  grand_total: number;

  @IsNotEmpty()
  @Column()
  cart_session_id: string;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @Column()
  user_id: number;

  @OneToMany(() => CartItems, (cart_items) => cart_items.cart)
  cart_items: CartItems;

  @OneToOne(() => Users, (users) => users.cart)
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @BeforeInsert()
  setCartSessionId() {
    this.cart_session_id = (Math.random() + 5).toString(36).substring(2);
  }

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
