import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity('easy_parcel_auth')
export class EasyParcelAuth extends BaseEntity {
  @Column({ type: 'text' })
  auth_token: string;

  @Column({ type: 'text' })
  auth_key: string;

  @Column({ type: 'text' })
  refresh_token: string;

  @Column({ type: 'varchar' })
  redirect_url: string;

  @Column({ type: 'varchar' })
  endpoint: string;

  @Column({ type: 'varchar' })
  version: string;

  @Column({ type: 'varchar', default: 'demo' })
  type: string;
}
