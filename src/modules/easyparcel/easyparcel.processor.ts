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
import type {
  EasyParcelSyncResult,
  SubmitOrderDto,
} from './dto/submit-order.dto';

@Processor(EASY_PARCEL_QUEUE)
export class EasyparcelProcessor extends WorkerHost {
  private readonly logger = new Logger(EasyparcelProcessor.name);

  constructor(
    private readonly easyparcelService: EasyparcelService,
    private readonly ordersService: OrdersService,
  ) {
    super();
  }

  async process(
    job: Job,
  ): Promise<BaseServiceDto<boolean | EasyParcelSyncResult>> {
    switch (job.name) {
      case EASY_PARCEL_SAMPLE_JOB:
        return createSuccessResponse(true);
      case EASY_PARCEL_PAID_ORDER_JOB:
        return this.processPaidOrder(job as Job<SubmitOrderDto>);
      default:
        throw new Error(`Unknown EasyParcel job: ${job.name}`);
    }
  }

  private async processPaidOrder(
    job: Job<SubmitOrderDto>,
  ): Promise<BaseServiceDto<EasyParcelSyncResult>> {
    const easyParcelOrder = job.data;
    const orderResponse = await this.ordersService.findOne(
      easyParcelOrder.order_id,
    );
    const order = orderResponse?.data;

    if (!order) {
      throw new NotFoundException(
        `Order ID ${easyParcelOrder.order_id} not found.`,
      );
    }

    if (order.status !== 'paid') {
      throw new UnprocessableEntityException(
        `Order ID ${order.id} is not paid.`,
      );
    }

    const shipment = easyParcelOrder.shipment;
    if (!shipment?.length) {
      throw new UnprocessableEntityException(
        `Job for order ID ${order.id} does not contain EasyParcel shipment details.`,
      );
    }

    const response = await this.easyparcelService.submitOrder(easyParcelOrder);

    if (!response?.status) {
      throw new UnprocessableEntityException(
        'EasyParcel did not confirm shipment submission.',
      );
    }
    await this.ordersService.update(order.id, {
      status: 'completed',
      sync_easyparcel: 1,
    });

    return createSuccessResponse({
      message:
        response.data?.message || 'Order synced to EasyParcel successfully.',
      response: response.data,
    });
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
