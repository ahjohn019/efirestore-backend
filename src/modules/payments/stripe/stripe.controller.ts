import {
  Controller,
  Post,
  Body,
  UseGuards,
  Put,
  Req,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutIdStripeDto } from './dto/checkout-stripe.dto';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateCheckoutStripeDto } from './dto/update-stripe.dto';
import { AuthGuard } from '../../../commons/guards/auth';
import { Request as ExpressRequest } from 'express';

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
  retrieveStripeCheckout(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.retrieveStripeCheckout(checkoutIdStripeDto);
  }

  @Put('/checkout/update')
  @UseGuards(AuthGuard)
  updateStripeCheckout(
    @Body() updateCheckoutStripeDto: UpdateCheckoutStripeDto,
  ) {
    return this.stripeService.updateStripeCheckout(updateCheckoutStripeDto);
  }

  @Post('/checkout/get/line-items')
  @UseGuards(AuthGuard)
  checkoutGetLineItems(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.checkoutGetLineItems(checkoutIdStripeDto);
  }

  @Post('/webhook')
  postWebhook(@Req() request: ExpressRequest & { rawBody?: Buffer }) {
    return this.stripeService.postWebhook(request);
  }
}
