import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Carts, CartItems } from './entities/carts.entity';
import { Products } from '../products/entities/products.entity';
import { Users } from '../users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Carts, CartItems, Products, Users])],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartModule {}
