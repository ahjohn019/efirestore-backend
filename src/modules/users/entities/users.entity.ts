import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  OneToMany,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../../enum/role.enum';
import { Gender } from '../../../enum/gender.enum';
import { AddressType } from '../../../enum/address-type.enum';
import * as bcrypt from 'bcrypt';
import { Orders } from '../../orders/entities/orders.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { StripeUsers } from '../../payments/stripe/entities/stripe.entity';

// Users Entity
@Entity()
export class Users extends BaseEntity {
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

  @Column({ nullable: true })
  reset_password_token: string;

  @Column({ nullable: true })
  reset_password_expired_at: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }

  @OneToMany(() => UserDetails, (userDetails) => userDetails.users, {
    cascade: true,
  })
  user_details: UserDetails[];

  @OneToMany(() => Orders, (orders) => orders.user, {
    cascade: true,
  })
  orders: Orders[];

  @OneToOne(() => StripeUsers, (stripeUsers) => stripeUsers.user)
  stripe_users: StripeUsers;
}

// UserDetails Entity
@Entity()
export class UserDetails extends BaseEntity {
  @Column()
  user_id: number; // Foreign key for the Users entity

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
  // stripe_verification: number;

  @ManyToOne(() => Users, (user) => user.user_details)
  @JoinColumn({ name: 'user_id' })
  users: Users;

  @Column({ type: 'enum', enum: Gender })
  gender: string;
}
