import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from './entities/orders.entity';
import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { OrderItemsModule } from '../order_items/order_items.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    OrderItemsModule,
    TypeOrmModule.forFeature([Orders]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
