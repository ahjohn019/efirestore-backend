import { Test, TestingModule } from '@nestjs/testing';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';

jest.mock('../../../commons/guards/auth', () => ({
  AuthGuard: class MockAuthGuard {},
}));

describe('StripeController', () => {
  let controller: StripeController;
  let service: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeController],
      providers: [
        {
          provide: StripeService,
          useValue: {
            checkout: jest.fn(),
            retrieveStripeCheckout: jest.fn(),
            updateStripeCheckout: jest.fn(),
            checkoutGetLineItems: jest.fn(),
            postWebhook: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<StripeController>(StripeController);
    service = module.get(StripeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should forward webhook requests to the service', () => {
    const request = { rawBody: Buffer.from('body') } as any;

    controller.postWebhook(request);

    expect(service.postWebhook).toHaveBeenCalledWith(request);
  });
});
