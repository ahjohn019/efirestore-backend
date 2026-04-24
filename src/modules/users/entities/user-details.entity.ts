import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { Gender } from '../../../enum/gender.enum';
import { BaseEntity } from '../../base/entities/base.entity';
import { Users } from './users.entity';

@Entity('user_details')
export class UserDetails extends BaseEntity {
  @Column()
  user_id: number;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column()
  city: string;

  @Column()
  state: string;

  @Column()
  country: string;

  @Column()
  phone_number: string;

  @Column()
  identity_card_number: string;

  @OneToOne(() => Users, (user) => user.user_details)
  @JoinColumn({ name: 'user_id' })
  users: any;

  @Column({ type: 'enum', enum: Gender })
  gender: string;
}
