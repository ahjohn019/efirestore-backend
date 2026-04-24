import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './entities/users.entity';
import { UserDetails } from './entities/user-details.entity';
import { UserAddress } from './entities/user-address.entity';
import { StripeModule } from '../payments/stripe/stripe.module';
import { StripeCustomerService } from '../payments/stripe/customer/customer.service';
import { StripeUsers } from '../payments/stripe/entities/stripe.entity';
import { UserDetailsStripeService } from './stripe/user-details.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users, UserDetails, UserAddress, StripeUsers]),
    StripeModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, StripeCustomerService, UserDetailsStripeService],
  exports: [UsersService],
})
export class UsersModule {}
