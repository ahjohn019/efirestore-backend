import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { UsersModule } from '../../users/users.module';
import { ProductsModule } from 'src/modules/products/products.module';

@Module({
  imports: [UsersModule, ProductsModule],
  controllers: [StripeController],
  providers: [StripeService],
})
export class StripeModule {}
