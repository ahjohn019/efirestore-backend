import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Products } from '../products/entities/products.entity';
import { CategoriesController } from './categories.controller';
import { Categories } from './entities/categories.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Categories, Products])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
