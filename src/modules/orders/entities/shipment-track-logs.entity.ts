import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity('shipment_track_logs')
export class ShipmentTrackLogs extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ length: 255 })
  tracking_status: string;

  @Column({ type: 'json', nullable: true })
  raw_data: Record<string, unknown> | Record<string, unknown>[] | null;
}
