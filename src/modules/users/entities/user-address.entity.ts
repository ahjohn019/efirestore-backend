import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';
import { Users } from './users.entity';

@Entity('user_addresses')
export class UserAddress extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  address_line_one: string;

  @Column({ type: 'text', nullable: true })
  address_line_two: string;

  @Column()
  address_type: string;

  @Column({ type: 'int' })
  postal_code: number;

  @Column({ type: 'boolean' })
  status: boolean;

  @Column()
  user_id: number;

  @ManyToOne(() => Users, (user) => user.user_addresses)
  @JoinColumn({ name: 'user_id' })
  users: any;
}
