import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders, OrderItems } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { OrderRefundController } from './refund/refund.controller';
import { OrderRefundService } from './refund/refund.service';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, Users])],
  controllers: [OrdersController, OrderRefundController],
  providers: [OrdersService, OrderRefundService, IsUserEmail],
  exports: [OrdersService],
})
export class OrdersModule {}
