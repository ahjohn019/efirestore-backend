import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from '../modules/orders/entities/orders.entity';
import { Carts } from 'src/modules/carts/entities/carts.entity';
import { StripeModule } from 'src/modules/payments/stripe/stripe.module';

@Module({
  imports: [TypeOrmModule.forFeature([Orders, Carts]), StripeModule],
  providers: [CronjobsService],
})
export class CronjobsModule {}
