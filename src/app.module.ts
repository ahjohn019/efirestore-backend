import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './config/datasource';
import { UsersModule } from './modules/users/users.module';
import { IsUnique } from './shared/validation/is_unique';
import { AuthModule } from './modules/auth/auth.module';
import { mailerConfig } from './config/mailer';
import { MailerModule } from '@nestjs-modules/mailer';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ImagesModule } from './modules/images/images.module';
import { CartModule } from './modules/carts/carts.module';
import { CartItemsModule } from './modules/cart_items/cart_items.module';
import { ToyyibpayModule } from './modules/payments/toyyibpay/toyyibpay.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    AuthModule,
    MailerModule.forRoot(mailerConfig()),
    ProductsModule,
    CategoriesModule,
    ImagesModule,
    CartModule,
    CartItemsModule,
    ToyyibpayModule,
  ],
  controllers: [AppController],
  providers: [AppService, IsUnique],
})
export class AppModule {}
