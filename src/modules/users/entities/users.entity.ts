import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../../enum/role.enum';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { Carts } from '../../carts/entities/carts.entity';
import { Orders } from '../../orders/entities/orders.entity';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: string;

  @Column({ nullable: true })
  remember_token: string;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @OneToOne(() => Carts, (cart) => cart.user)
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

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @OneToMany(() => Orders, (orders) => orders.user, {
    cascade: true,
  })
  orders: Orders;
}
