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
import { Gender } from '../../../enum/gender.enum';
import { AddressType } from '../../../enum/address-type.enum';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { Orders } from '../../orders/entities/orders.entity';

@Entity()
export class UserDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  address_one: string;

  @Column()
  address_two: string;

  @Column()
  postal_code: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column({ type: 'enum', enum: AddressType })
  address_type: string;

  @Column({ default: 0 })
  is_default: number;

  @Column()
  phone_number: string;

  @Column()
  identity_card_number: string;

  @Column({ type: 'enum', enum: Gender })
  gender: string;
}

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
