import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import * as dayjs from 'dayjs';
import { Categories } from '../../categories/entities/categories.entity';

@Entity()
export class Products {
  @PrimaryGeneratedColumn()
  id: number;

  @IsNotEmpty()
  @Column()
  name: string;

  @IsNotEmpty()
  @Column()
  sku: string;

  @Column()
  description: string;

  @IsNotEmpty()
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @ManyToOne(() => Categories, (categories) => categories.products, {
    nullable: true,
    eager: true,
  })
  @JoinColumn({ name: 'category_id' })
  categories: Categories;

  @BeforeInsert()
  setDefaultDates() {
    const currentDate = dayjs().format('YYYY-MM-DD HH:mm:ss');
    this.created_at = new Date(currentDate);
    this.updated_at = new Date(currentDate);
  }

  @BeforeUpdate()
  updateTimestamp() {
    this.updated_at = new Date(dayjs().format('YYYY-MM-DD HH:mm:ss'));
  }
}
