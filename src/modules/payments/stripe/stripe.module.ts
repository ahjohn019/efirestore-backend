import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { ProductsModule } from 'src/modules/products/products.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductExists } from 'src/shared/validation/product/is_product_exists';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeUsers } from './entities/stripe.entity';
import { StripeCustomerController } from './customer/customer.controller';
import { StripeCustomerService } from './customer/customer.service';
import { Users } from 'src/modules/users/entities/users.entity';

@Module({
  imports: [
    OrdersModule,
    ProductsModule,
    TypeOrmModule.forFeature([StripeUsers, Users]),
  ],
  controllers: [StripeController, StripeCustomerController],
  providers: [
    StripeService,
    StripeCustomerService,
    IsUserEmail,
    IsDuplicateProducts,
    IsProductExists,
  ],
  exports: [StripeService, StripeCustomerService],
})
export class StripeModule {}
