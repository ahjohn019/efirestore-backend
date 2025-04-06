import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders, OrderItems } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, Users])],
  controllers: [OrdersController],
  providers: [OrdersService, IsUserEmail],
  exports: [OrdersService],
})
export class OrdersModule { }
