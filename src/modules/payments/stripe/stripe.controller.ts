import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutIdStripeDto } from './dto/checkout-stripe.dto';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { AuthGuard } from '../../../commons/guards/auth';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/checkout')
  @UseGuards(AuthGuard)
  checkout(@Body() createStripeDto: CreateStripeDto) {
    return this.stripeService.checkout(createStripeDto);
  }

  @Post('/checkout/get')
  @UseGuards(AuthGuard)
  checkoutGet(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.retrieveStripeCheckout(checkoutIdStripeDto);
  }

  @Post('/checkout/get/line-items')
  @UseGuards(AuthGuard)
  checkoutGetLineItems(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.checkoutGetLineItems(checkoutIdStripeDto);
  }

  @Post('/webhook')
  postWebhook(@Request() request) {
    return this.stripeService.postWebhook(request);
  }
}
