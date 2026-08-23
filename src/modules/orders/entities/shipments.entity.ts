import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';
import { Orders } from './orders.entity';

@Entity('shipments')
@Index('IDX_shipments_order_id', ['order_id'])
export class Shipments extends BaseEntity {
  @Column()
  order_id: number;

  @Column({ length: 100 })
  courier: string;

  @Column({ length: 255, unique: true })
  tracking_number: string;

  @Column({ length: 100, default: 'pending' })
  shipment_status: string;

  @Column({ type: 'json', nullable: true })
  raw_data: Record<string, unknown> | null;

  @ManyToOne(() => Orders, (order) => order.shipments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Orders;
}
