import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, QueueEvents } from 'bullmq';
import { BaseServiceDto } from '../base/dto/base-service.dto';
import type { EasyParcelSyncResult, SubmitOrderDto } from './dto/submit-order.dto';
import {
  EASY_PARCEL_QUEUE,
  EASY_PARCEL_PAID_ORDER_JOB,
  EASY_PARCEL_SAMPLE_JOB,
} from './easyparcel-queue.constants';

@Injectable()
export class EasyparcelQueueService implements OnModuleDestroy {
  constructor(
    @InjectQueue(EASY_PARCEL_QUEUE)
    private readonly easyparcelQueue: Queue,
    @Inject('EASY_PARCEL_QUEUE_EVENTS')
    private readonly queueEvents: QueueEvents,
  ) {}

  async enqueueSampleJob(): Promise<void> {
    await this.easyparcelQueue.add(EASY_PARCEL_SAMPLE_JOB, {});
  }

  async enqueuePaidOrder(easyParcelOrder: SubmitOrderDto): Promise<BaseServiceDto<EasyParcelSyncResult>> {
    await this.queueEvents.waitUntilReady();
    const jobId = `easyparcel-order-${easyParcelOrder.order_id}`;

    const existingJob = await this.easyparcelQueue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();

      if (state === 'failed') {
        await existingJob.updateData(easyParcelOrder);
        await existingJob.retry();
      }

      return existingJob.waitUntilFinished(this.queueEvents, 60000);
    }
    const job = await this.easyparcelQueue.add(
      EASY_PARCEL_PAID_ORDER_JOB,
      easyParcelOrder,
      {
        jobId,
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
    return job.waitUntilFinished(this.queueEvents, 60000);
  }

  async onModuleDestroy(): Promise<void> {
    await this.queueEvents.close();
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
