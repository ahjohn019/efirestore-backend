import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Products } from './entities/products.entity';
import { Categories } from '../categories/entities/categories.entity';
import { Images } from '../images/entities/images.entity';
import { ImagesService } from '../images/images.service';
import { ImageSource } from '../../config/imagesource';

@Module({
  imports: [
    ImageSource,
    TypeOrmModule.forFeature([Products, Categories, Images]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ImagesService],
  exports: [ProductsService],
})
export class ProductsModule {}
