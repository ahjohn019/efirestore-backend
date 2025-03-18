import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../base/entities/base.entity';

@Entity()
export class StripeUsers extends BaseEntity {
  @Column()
  user_id: number;

  @Column()
  stripe_account_id: string;
}

export class Stripe {}
