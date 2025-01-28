import { Test, TestingModule } from '@nestjs/testing';
import { ToyyibpayService } from './toyyibpay.service';

describe('ToyyibpayService', () => {
  let service: ToyyibpayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ToyyibpayService],
    }).compile();

    service = module.get<ToyyibpayService>(ToyyibpayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
