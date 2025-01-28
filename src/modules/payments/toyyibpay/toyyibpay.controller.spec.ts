import { Test, TestingModule } from '@nestjs/testing';
import { ToyyibpayController } from './toyyibpay.controller';
import { ToyyibpayService } from './toyyibpay.service';

describe('ToyyibpayController', () => {
  let controller: ToyyibpayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToyyibpayController],
      providers: [ToyyibpayService],
    }).compile();

    controller = module.get<ToyyibpayController>(ToyyibpayController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
