import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bullmq';
import {
  EASY_PARCEL_QUEUE,
  EASY_PARCEL_PAID_ORDER_JOB,
  EASY_PARCEL_SAMPLE_JOB,
} from './easyparcel-queue.constants';
import { EasyparcelQueueService } from './easyparcel-queue.service';

describe('EasyparcelQueueService', () => {
  let service: EasyparcelQueueService;
  let queue: Pick<Queue, 'add' | 'getJobCounts'>;

  beforeEach(async () => {
    queue = {
      add: jest.fn().mockResolvedValue({}),
      getJobCounts: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 1,
        completed: 2,
        failed: 0,
        delayed: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EasyparcelQueueService,
        { provide: getQueueToken(EASY_PARCEL_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get(EasyparcelQueueService);
  });

  it('adds the sample job to the EasyParcel queue', async () => {
    await expect(service.enqueueSampleJob()).resolves.toBeUndefined();
    expect(queue.add).toHaveBeenCalledWith(EASY_PARCEL_SAMPLE_JOB, {});
  });

  it('adds an idempotent paid-order job with retries', async () => {
    await expect(service.enqueuePaidOrder(42)).resolves.toBeUndefined();
    expect(queue.add).toHaveBeenCalledWith(
      EASY_PARCEL_PAID_ORDER_JOB,
      { orderId: 42 },
      {
        jobId: 'easyparcel-order-42',
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  });

  it('returns monitored job counts', async () => {
    await expect(service.getQueueStatus()).resolves.toEqual({
      waiting: 0,
      active: 1,
      completed: 2,
      failed: 0,
      delayed: 0,
    });
    expect(queue.getJobCounts).toHaveBeenCalledWith(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
    );
  });
});
