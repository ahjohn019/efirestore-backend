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
  let queue: Pick<Queue, 'add' | 'getJobCounts' | 'getJob'>;

  const result = { status: 'success', code: 200, data: { message: 'Shipment created', response: { message: 'Shipment created' } } };
  const waitUntilFinished = jest.fn().mockResolvedValue(result);
  const queueEvents = { waitUntilReady: jest.fn().mockResolvedValue(undefined), close: jest.fn() };

  beforeEach(async () => {
    queue = {
      getJob: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue({ waitUntilFinished }),
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
        { provide: 'EASY_PARCEL_QUEUE_EVENTS', useValue: queueEvents },
      ],
    }).compile();

    service = module.get(EasyparcelQueueService);
  });

  it('adds the sample job to the EasyParcel queue', async () => {
    await expect(service.enqueueSampleJob()).resolves.toBeUndefined();
    expect(queue.add).toHaveBeenCalledWith(EASY_PARCEL_SAMPLE_JOB, {});
  });

  it('adds an idempotent paid-order job with retries', async () => {
    const easyParcelOrder = { order_id: 42, shipment: [] };
    await expect(service.enqueuePaidOrder(easyParcelOrder)).resolves.toEqual(result);
    expect(waitUntilFinished).toHaveBeenCalledWith(queueEvents, 60000);
    expect(queue.add).toHaveBeenCalledWith(
      EASY_PARCEL_PAID_ORDER_JOB,
      easyParcelOrder,
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

  it('propagates submission failures instead of returning success', async () => {
    waitUntilFinished.mockRejectedValueOnce(new Error('Invalid collection date'));
    await expect(service.enqueuePaidOrder({ order_id: 42, shipment: [] }))
      .rejects.toThrow('Invalid collection date');
  });

  it('updates a failed job with the direct payload before retrying', async () => {
    const easyParcelOrder = { order_id: 42, shipment: [] };
    const existingJob = {
      getState: jest.fn().mockResolvedValue('failed'),
      waitUntilFinished,
      updateData: jest.fn().mockResolvedValue(undefined),
      retry: jest.fn().mockResolvedValue(undefined),
    };
    (queue.getJob as jest.Mock).mockResolvedValue(existingJob);

    await service.enqueuePaidOrder(easyParcelOrder);

    expect(existingJob.updateData).toHaveBeenCalledWith(easyParcelOrder);
    expect(existingJob.retry).toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

});
