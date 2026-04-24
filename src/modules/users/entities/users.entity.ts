import {
  Entity,
  Column,
  BeforeInsert,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Role } from '../../../enum/role.enum';
import * as bcrypt from 'bcrypt';
import { Orders } from '../../orders/entities/orders.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { StripeUsers } from '../../payments/stripe/entities/stripe.entity';
import { UserDetails } from './user-details.entity';
import { UserAddress } from './user-address.entity';

export { UserDetails } from './user-details.entity';
export { UserAddress } from './user-address.entity';

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

  @OneToOne(() => UserDetails, (userDetails) => userDetails.users, {
    cascade: true,
  })
  user_details?: any;

  @OneToMany(() => Orders, (orders) => orders.user, {
    cascade: true,
  })
  orders: Orders[];

  @OneToOne(() => StripeUsers, (stripeUsers) => stripeUsers.user)
  stripe_users: any;

  @OneToMany(() => UserAddress, (userAddress) => userAddress.users, {
    cascade: true,
  })
  user_addresses: UserAddress[];
}
