import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/modules/base/entities/base.entity';
import { Users } from 'src/modules/users/entities/users.entity';

@Entity()
export class StripeUsers extends BaseEntity {
  @Column()
  user_id: number;

  @Column()
  stripe_account_id: string;

  @OneToOne(() => Users, (user) => user.stripe_users)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}

export class Stripe {}
