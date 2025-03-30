import { Injectable, Inject, forwardRef } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class BaseStripeService {
  protected stripe: Stripe;
  protected stripeEndpointSecret: string;

  constructor(protected configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_PAYMENT_DEV_SECRET_KEY'),
      {
        apiVersion: '2025-01-27.acacia',
      },
    );
    this.stripeEndpointSecret = this.configService.get<string>(
      'STRIPE_ENDPOINT_SECRET',
    );
  }
}
