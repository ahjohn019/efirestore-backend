import { OrdersService } from './orders.service';
import { Repository } from 'typeorm';
import { Orders } from './entities/orders.entity';
import { Users } from '../users/entities/users.entity';
import { ConfigService } from '@nestjs/config';
import { EasyparcelService } from '../easyparcel/easyparcel.service';

jest.mock('./order.util', () => ({
  buildEasyParcelOrder: jest.fn().mockReturnValue({ order_id: 42, shipment: [] }),
}));

describe('OrdersService EasyParcel synchronization', () => {
  const repository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const easyparcel = { submitOrder: jest.fn() };
  const service = new OrdersService(
    repository as unknown as Repository<Orders>,
    {} as Repository<Users>,
    easyparcel as unknown as EasyparcelService,
    {} as ConfigService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.findOne.mockResolvedValue({
      id: 42, status: 'paid',
      user: { user_addresses: [{ address_type: 'shipping', status: true }] },
    });
    repository.update.mockResolvedValue({ affected: 1 });
  });

  it('submits directly and updates the order after success', async () => {
    const response = { status: 'success', code: 200, data: { message: 'Synced' } };
    easyparcel.submitOrder.mockResolvedValue({ status: true, data: { message: 'Synced' } });
    await expect(service.verifyOrder(42)).resolves.toEqual({ status: 'success', code: 200, data: { message: 'Synced', response: { message: 'Synced' } } });
    expect(repository.update).toHaveBeenCalledWith(42, {
      status: 'completed', sync_easyparcel: 1,
    });
  });

  it('does not update the order when submission fails', async () => {
    easyparcel.submitOrder.mockRejectedValue(new Error('Submission rejected'));
    await expect(service.verifyOrder(42)).rejects.toThrow('Submission rejected');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not update the order when the worker returns an unsuccessful result', async () => {
    easyparcel.submitOrder.mockResolvedValue({ status: false });
    await expect(service.verifyOrder(42)).rejects.toThrow('EasyParcel synchronization failed');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
