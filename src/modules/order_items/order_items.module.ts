import { Module } from '@nestjs/common';
import { OrderItemsService } from './order_items.service';
import { OrderItemsController } from './order_items.controller';
import { OrderItems } from './entities/order_items.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItems])],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
