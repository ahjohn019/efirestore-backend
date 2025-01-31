import { Injectable, Inject } from '@nestjs/common';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import Stripe from 'stripe';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_PAYMENT_DEV_SECRET_KEY'),
      {
        apiVersion: '2025-01-27.acacia',
      },
    );
  }
  async checkout(createStripeDto: CreateStripeDto, req) {
    const session = await this.stripe.checkout.sessions.create(req.body);
    return { status: true, data: session };
  }

  async checkoutGet(req) {
    const session = await this.stripe.checkout.sessions.retrieve(
      req.body.checkout_id,
    );
    return { status: true, data: session };
  }

  async checkoutGetLineItems(req) {
    const session = await this.stripe.checkout.sessions.listLineItems(
      req.body.checkout_id,
    );
    return { status: true, data: session };
  }

  findAll() {
    return `This action returns all stripe`;
  }

  findOne(id: number) {
    return `This action returns a #${id} stripe`;
  }

  update(id: number, updateStripeDto: UpdateStripeDto) {
    return `This action updates a #${id} stripe`;
  }

  remove(id: number) {
    return `This action removes a #${id} stripe`;
  }
}
