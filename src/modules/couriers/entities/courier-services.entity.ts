import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Couriers } from './couriers.entity';

@Entity('courier_services')
export class CourierServices {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'bigint', unsigned: true })
  courier_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'int', unsigned: true })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'myr' })
  currency: string;

  @Column({ type: 'int', unsigned: true, nullable: true })
  delivery_minimum: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  delivery_minimum_unit: string | null;

  @Column({ type: 'int', unsigned: true, nullable: true })
  delivery_maximum: number | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  delivery_maximum_unit: string | null;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date | null;

  @ManyToOne(() => Couriers, (courier) => courier.services)
  @JoinColumn({ name: 'courier_id' })
  courier: Couriers;
}
