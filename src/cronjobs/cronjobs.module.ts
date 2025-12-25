import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from '../modules/orders/entities/orders.entity';
import { StripeService } from 'src/modules/payments/stripe/stripe.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Users } from 'src/modules/users/entities/users.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, Users])],
  providers: [CronjobsService, StripeService, OrdersService],
})
export class CronjobsModule {}
