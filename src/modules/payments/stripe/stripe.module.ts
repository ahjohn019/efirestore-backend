import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from 'src/modules/users/users.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { OrdersModule } from 'src/modules/orders/orders.module';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductExists } from 'src/shared/validation/product/is_product_exists';
import { OrdersService } from 'src/modules/orders/orders.service';
@Module({
  imports: [UsersModule, ProductsModule, OrdersModule],
  controllers: [StripeController],
  providers: [StripeService, IsUserEmail, IsDuplicateProducts, IsProductExists],
})
export class StripeModule {}
