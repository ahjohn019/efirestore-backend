import { createSuccessResponse } from '../base/base.service';
import { BaseServiceDto } from '../base/dto/base-service.dto';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import {
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EASY_PARCEL_PAID_ORDER_JOB,
  EASY_PARCEL_QUEUE,
  EASY_PARCEL_SAMPLE_JOB,
} from './easyparcel-queue.constants';
import { EasyparcelService } from './easyparcel.service';
import { OrdersService } from '../orders/orders.service';

interface PaidOrderJobData {
  orderId: number;
}

@Processor(EASY_PARCEL_QUEUE)
export class EasyparcelProcessor extends WorkerHost {
  private readonly logger = new Logger(EasyparcelProcessor.name);

  constructor(
    private readonly easyparcelService: EasyparcelService,
    private readonly ordersService: OrdersService,
  ) {
    super();
  }

  async process(job: Job): Promise<BaseServiceDto<boolean>> {
    switch (job.name) {
      case EASY_PARCEL_SAMPLE_JOB:
        return createSuccessResponse(true);
      case EASY_PARCEL_PAID_ORDER_JOB:
        return this.processPaidOrder(job as Job<PaidOrderJobData>);
      default:
        throw new Error(`Unknown EasyParcel job: ${job.name}`);
    }
  }

  private async processPaidOrder(
    job: Job<PaidOrderJobData>,
  ): Promise<BaseServiceDto<boolean>> {
    const orderResponse = await this.ordersService.findOne(job.data.orderId);
    const order = orderResponse?.data;

    if (!order) {
      throw new NotFoundException(`Order ID ${job.data.orderId} not found.`);
    }

    if (order.status !== 'paid') {
      throw new UnprocessableEntityException(
        `Order ID ${order.id} is not paid.`,
      );
    }

    if (!order.easyparcel_shipment?.length) {
      throw new UnprocessableEntityException(
        `Order ID ${order.id} does not contain EasyParcel shipment details.`,
      );
    }

    await this.easyparcelService.submitOrder({
      order_id: order.id,
      shipment: order.easyparcel_shipment,
    });

    return createSuccessResponse(true);
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Job ${job.id} (${job.name}) started`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Job ${job.id} (${job.name}) completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    this.logger.error(
      `Job ${job?.id ?? 'unknown'} (${job?.name ?? 'unknown'}) failed: ${error.message}`,
      error.stack,
    );
  }
}
