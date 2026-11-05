import { Test, TestingModule } from '@nestjs/testing';
import { EasyparcelQueueService } from './easyparcel-queue.service';
import { EasyparcelController } from './easyparcel.controller';
import { EasyparcelService } from './easyparcel.service';

describe('EasyparcelController', () => {
  let controller: EasyparcelController;
  let queueService: {
    enqueueSampleJob: jest.Mock;
    getQueueStatus: jest.Mock;
  };

  beforeEach(async () => {
    queueService = {
      enqueueSampleJob: jest.fn().mockResolvedValue(undefined),
      getQueueStatus: jest.fn().mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 1,
        failed: 0,
        delayed: 0,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EasyparcelController],
      providers: [
        { provide: EasyparcelService, useValue: {} },
        { provide: EasyparcelQueueService, useValue: queueService },
      ],
    }).compile();

    controller = module.get(EasyparcelController);
  });

  it('enqueues a sample job and returns a success response', async () => {
    await expect(controller.enqueueSampleJob()).resolves.toEqual({
      status: 'success',
      code: 200,
      data: true,
    });
    expect(queueService.enqueueSampleJob).toHaveBeenCalledTimes(1);
  });

  it('returns the EasyParcel queue counts', async () => {
    await expect(controller.getQueueStatus()).resolves.toEqual({
      status: true,
      data: {
        waiting: 0,
        active: 0,
        completed: 1,
        failed: 0,
        delayed: 0,
      },
    });
  });
});
