import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';
import { Orders } from './orders.entity';

@Entity('shipments')
@Index('IDX_shipments_order_id', ['order_id'])
export class Shipments extends BaseEntity {
  @Column()
  order_id: number;

  @Column({ length: 100 })
  courier: string;

  @Column({ length: 100, nullable: true })
  service_type: string | null;

  @Column({ length: 255, unique: true })
  tracking_number: string;

  @Column({ length: 100, default: 'pending' })
  shipment_status: string;

  @Column({ length: 255, nullable: true })
  courier_reference: string | null;

  @Column({ type: 'text', nullable: true })
  label_url: string | null;

  @Column({ type: 'timestamp', nullable: true })
  shipped_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  last_tracking_at: Date | null;

  @ManyToOne(() => Orders, (order) => order.shipments, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: Orders;

  @OneToMany(() => ShipmentTrackingEvents, (event) => event.shipment, {
    cascade: true,
  })
  tracking_events: ShipmentTrackingEvents[];
}

@Entity('shipment_tracking_events')
@Index('IDX_shipment_tracking_events_shipment_id_event_time', [
  'shipment_id',
  'event_time',
])
export class ShipmentTrackingEvents extends BaseEntity {
  @Column()
  shipment_id: number;

  @Column({ length: 100 })
  status: string;

  @Column({ length: 255, nullable: true })
  courier_status: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'timestamp' })
  event_time: Date;

  @Column({ type: 'json', nullable: true })
  raw_data: Record<string, unknown> | null;

  @ManyToOne(() => Shipments, (shipment) => shipment.tracking_events, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipments;
}
