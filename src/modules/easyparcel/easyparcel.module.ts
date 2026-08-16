import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EasyparcelController } from './easyparcel.controller';
import { EasyparcelService } from './easyparcel.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.getOrThrow<string>('EASY_PARCEL_ENDPOINT'),
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  controllers: [EasyparcelController],
  providers: [EasyparcelService],
  exports: [EasyparcelService],
})
export class EasyparcelModule {}
