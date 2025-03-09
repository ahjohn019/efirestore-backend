import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from '../../users/users.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from 'src/shared/validation/product/is_duplicate_products';
import { IsProductExists } from 'src/shared/validation/product/is_product_exists';
@Module({
  imports: [UsersModule, ProductsModule],
  controllers: [StripeController],
  providers: [StripeService, IsUserEmail, IsDuplicateProducts, IsProductExists],
})
export class StripeModule {}
