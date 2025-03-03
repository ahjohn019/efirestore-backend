import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from '../../users/users.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { IsUserEmail } from 'src/shared/validation/user/is_user_email';
import { IsDuplicateProducts } from '../../../shared/validation/product/is_duplicate_products';
@Module({
  imports: [UsersModule, ProductsModule],
  controllers: [StripeController],
  providers: [StripeService, IsUserEmail, IsDuplicateProducts],
})
export class StripeModule {}
