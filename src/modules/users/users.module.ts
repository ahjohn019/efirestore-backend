import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetails, Users } from './entities/users.entity';
import { StripeModule } from '../payments/stripe/stripe.module';
import { OrdersModule } from '../orders/orders.module';
import { StripeCustomerService } from '../payments/stripe/customer/customer.service';
import { StripeUsers } from '../payments/stripe/entities/stripe.entity';
import { UserDetailsStripeService } from './stripe/user-details.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserDetails, StripeUsers]),
    StripeModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, StripeCustomerService, UserDetailsStripeService],
  exports: [UsersService, UserDetailsStripeService],
})
export class UsersModule {}
