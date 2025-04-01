import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import * as dayjs from 'dayjs';
import { Users } from '../../users/entities/users.entity';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity()
export class Carts extends BaseEntity {
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
  cart_items: CartItems[];

  @OneToOne(() => Users, { cascade: true })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @BeforeInsert()
  setCartSessionId() {
    this.cart_session_id = (Math.random() + 5).toString(36).substring(2);
  }
}
@Entity()
export class CartItems extends BaseEntity {
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
  cart_id: number;

  @Column()
  product_id: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Carts, (cart) => cart.cart_items, {
    nullable: true,
  })
  @JoinColumn({ name: 'cart_id' })
  cart: Carts;
}
