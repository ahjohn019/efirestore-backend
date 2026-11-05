import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  EASY_PARCEL_QUEUE,
  EASY_PARCEL_PAID_ORDER_JOB,
  EASY_PARCEL_SAMPLE_JOB,
} from './easyparcel-queue.constants';

@Injectable()
export class EasyparcelQueueService {
  constructor(
    @InjectQueue(EASY_PARCEL_QUEUE)
    private readonly easyparcelQueue: Queue,
  ) {}

  async enqueueSampleJob(): Promise<void> {
    await this.easyparcelQueue.add(EASY_PARCEL_SAMPLE_JOB, {});
  }

  async enqueuePaidOrder(orderId: number): Promise<void> {
    await this.easyparcelQueue.add(
      EASY_PARCEL_PAID_ORDER_JOB,
      { orderId },
      {
        jobId: `easyparcel-order-${orderId}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async getQueueStatus() {
    return this.easyparcelQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
  }
}
