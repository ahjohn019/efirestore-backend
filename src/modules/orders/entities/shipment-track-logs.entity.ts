import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('shipment_track_logs')
export class ShipmentTrackLogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @Column({ length: 255 })
  tracking_status: string;

  @Column({ type: 'json', nullable: true })
  raw_data: Record<string, unknown> | Record<string, unknown>[] | null;
}
