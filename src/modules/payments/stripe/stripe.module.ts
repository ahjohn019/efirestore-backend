import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductExists } from 'src/shared/validation/product/is_product_exists';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StripeUsers } from './entities/stripe.entity';
import { StripeCustomerController } from './customer/customer.controller';
import { StripeCustomerService } from './customer/customer.service';

@Module({
  imports: [
    OrdersModule,
    forwardRef(() => UsersModule),
    ProductsModule,
    TypeOrmModule.forFeature([StripeUsers]),
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
