import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/modules/base/base.service';

@Injectable()
export class BaseStripeService extends BaseService {
  protected stripe: Stripe;
  protected stripeEndpointSecret: string;

  constructor(protected configService: ConfigService) {
    super();
    const stripeSecretKey = this.configService.get<string>(
      'STRIPE_PAYMENT_DEV_SECRET_KEY',
    );
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-01-27.acacia',
      });
    }
    const stripeEndpointSecret = this.configService.get<string>(
      'STRIPE_ENDPOINT_SECRET',
    );
    if (stripeEndpointSecret) {
      this.stripeEndpointSecret = stripeEndpointSecret;
    }
  }
}
