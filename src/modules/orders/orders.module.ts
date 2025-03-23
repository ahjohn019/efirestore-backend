import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders, OrderItems } from './entities/orders.entity';
import { ProductsModule } from '../products/products.module';
import { Users } from '../users/entities/users.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orders, OrderItems, Users]),
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
