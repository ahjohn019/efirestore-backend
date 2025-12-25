import { Module } from '@nestjs/common';
import { CronjobsService } from './cronjobs.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Orders } from '../modules/orders/entities/orders.entity';
import { StripeService } from 'src/modules/payments/stripe/stripe.service';
import { OrdersService } from 'src/modules/orders/orders.service';
import { Users } from 'src/modules/users/entities/users.entity';
import { CartsService } from 'src/modules/carts/carts.service';
import { CartItems, Carts } from 'src/modules/carts/entities/carts.entity';
import { Products } from 'src/modules/products/entities/products.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Orders, Users, Carts, CartItems, Products]),
  ],
  providers: [CronjobsService, StripeService, OrdersService, CartsService],
})
export class CronjobsModule {}
