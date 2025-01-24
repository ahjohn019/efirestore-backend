import { Module } from '@nestjs/common';
import { CartItemsService } from './cart_items.service';
import { CartItemsController } from './cart_items.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItems } from './entities/cart_items.entity';
import { ProductsModule } from '../products/products.module';
import { CartModule } from '../carts/carts.module';

@Module({
  imports: [TypeOrmModule.forFeature([CartItems]), ProductsModule, CartModule],
  controllers: [CartItemsController],
  providers: [CartItemsService],
})
export class CartItemsModule {}
