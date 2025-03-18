import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';
import { IsNotEmpty, Validate } from 'class-validator';
import { Products } from '../../products/entities/products.entity';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity()
export class Categories extends BaseEntity {
  @IsNotEmpty()
  @Column()
  name: string;

  @IsNotEmpty()
  @Column()
  slug: string;

  @Column({ type: 'datetime' })
  created_at: Date;

  @Column({ type: 'datetime' })
  updated_at: Date;

  @OneToMany(() => Products, (products) => products.categories)
  products: Products[];
}
