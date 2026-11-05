import { Job } from 'bullmq';
import {
  EASY_PARCEL_PAID_ORDER_JOB,
  EASY_PARCEL_SAMPLE_JOB,
} from './easyparcel-queue.constants';
import { EasyparcelProcessor } from './easyparcel.processor';
import { EasyparcelService } from './easyparcel.service';
import { OrdersService } from '../orders/orders.service';

describe('EasyparcelProcessor', () => {
  const easyparcelService = {
    submitOrder: jest.fn().mockResolvedValue({ status: true }),
  };
  const ordersService = {
    findOne: jest.fn(),
  };
  const processor = new EasyparcelProcessor(
    easyparcelService as unknown as EasyparcelService,
    ordersService as unknown as OrdersService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('returns a success response for the sample job', async () => {
    const job = { name: EASY_PARCEL_SAMPLE_JOB } as Job;

    await expect(processor.process(job)).resolves.toEqual({
      status: 'success',
      code: 200,
      data: true,
    });
  });

  it('submits the stored shipment for a paid order', async () => {
    const shipment = [{ service_id: 'EP-CS001' }];
    ordersService.findOne.mockResolvedValue({
      data: { id: 42, status: 'paid', easyparcel_shipment: shipment },
    });
    const job = {
      name: EASY_PARCEL_PAID_ORDER_JOB,
      data: { orderId: 42 },
    } as Job;

    await expect(processor.process(job)).resolves.toEqual({
      status: 'success',
      code: 200,
      data: true,
    });
    expect(easyparcelService.submitOrder).toHaveBeenCalledWith({
      order_id: 42,
      shipment,
    });
  });
  it.each([
    ['missing order', null, 'Order ID 42 not found.'],
    ['unpaid order', { id: 42, status: 'unpaid' }, 'Order ID 42 is not paid.'],
    [
      'missing shipment',
      { id: 42, status: 'paid' },
      'does not contain EasyParcel shipment details',
    ],
    [
      'empty shipment',
      { id: 42, status: 'paid', easyparcel_shipment: [] },
      'does not contain EasyParcel shipment details',
    ],
  ])(
    'rejects %s without submitting a shipment',
    async (_name, order, message) => {
      ordersService.findOne.mockResolvedValue({ data: order });

      await expect(
        processor.process({
          name: EASY_PARCEL_PAID_ORDER_JOB,
          data: { orderId: 42 },
        } as Job),
      ).rejects.toThrow(message as string);
      expect(easyparcelService.submitOrder).not.toHaveBeenCalled();
    },
  );

  it('propagates submission errors so BullMQ can retry the job', async () => {
    ordersService.findOne.mockResolvedValue({
      data: {
        id: 42,
        status: 'paid',
        easyparcel_shipment: [{ service_id: 'EP-CS001' }],
      },
    });
    easyparcelService.submitOrder.mockRejectedValueOnce(
      new Error('EasyParcel unavailable'),
    );

    await expect(
      processor.process({
        name: EASY_PARCEL_PAID_ORDER_JOB,
        data: { orderId: 42 },
      } as Job),
    ).rejects.toThrow('EasyParcel unavailable');
  });

  it('rejects unknown job names', async () => {
    await expect(processor.process({ name: 'unknown' } as Job)).rejects.toThrow(
      'Unknown EasyParcel job: unknown',
    );
    expect(easyparcelService.submitOrder).not.toHaveBeenCalled();
  });
});
