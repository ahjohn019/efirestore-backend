import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CourierServices } from './courier-services.entity';

@Entity('couriers')
export class Couriers {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: number;

  @Column({ type: 'timestamp', nullable: true })
  created_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  updated_at: Date | null;

  @OneToMany(() => CourierServices, (service) => service.courier)
  services: CourierServices[];
}
