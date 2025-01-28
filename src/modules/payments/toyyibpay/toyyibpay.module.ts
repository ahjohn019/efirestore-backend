import { Module } from '@nestjs/common';
import { ToyyibpayService } from './toyyibpay.service';
import { ToyyibpayController } from './toyyibpay.controller';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { HttpService } from '@nestjs/axios';

@Module({
  controllers: [ToyyibpayController],
  providers: [
    ToyyibpayService,
    {
      provide: 'TOYYIB_PAYMENT_URL',
      useFactory: (configService: ConfigService): HttpService => {
        const axiosInstance: AxiosInstance = axios.create({
          baseURL: configService.get<string>('TOYYIB_PAYMENT_URL'),
          timeout: 5000,
          maxRedirects: 5,
        });
        return new HttpService(axiosInstance);
      },
      inject: [ConfigService],
    },
  ],
})
export class ToyyibpayModule {}
