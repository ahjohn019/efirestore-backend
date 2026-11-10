import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EasyparcelController } from './easyparcel.controller';
import { EasyparcelService } from './easyparcel.service';
import { EasyParcelAuth } from './entities/easy-parcel-auth.entity';
import { Shipments } from '../orders/entities/shipments.entity';
import { ShipmentTrackLogs } from '../orders/entities/shipment-track-logs.entity';
import { BullModule, getQueueToken } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import { EasyparcelQueueService } from './easyparcel-queue.service';
import { EASY_PARCEL_QUEUE } from './easyparcel-queue.constants';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: EASY_PARCEL_QUEUE }),
    forwardRef(() => OrdersModule),
    TypeOrmModule.forFeature([EasyParcelAuth, Shipments, ShipmentTrackLogs]),
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
  providers: [EasyparcelService, EasyparcelQueueService, {
    provide: 'EASY_PARCEL_QUEUE_EVENTS',
    inject: [getQueueToken(EASY_PARCEL_QUEUE)],
    useFactory: (queue: Queue) => new QueueEvents(EASY_PARCEL_QUEUE, {
      connection: queue.opts.connection,
      prefix: queue.opts.prefix,
    }),
  }],
  exports: [EasyparcelService, EasyparcelQueueService],
})
export class EasyparcelModule {}
