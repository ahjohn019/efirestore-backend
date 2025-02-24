import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  RawBodyRequest,
  Request,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
import { CheckoutIdStripeDto } from './dto/checkout-id-stripe.dto';
import { CreateStripeDto } from './dto/create-stripe.dto';
import { UpdateStripeDto } from './dto/update-stripe.dto';
import { RolesGuard } from '../../../commons/guards/roles.guard';
import { Roles } from '../../../commons/decorators/roles.decorator';
import { Role } from '../../../enum/role.enum';
import { AuthGuard } from '../../../commons/guards/auth';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('/checkout')
  @UseGuards(AuthGuard)
  checkout(@Body() createStripeDto: CreateStripeDto, @Request() req) {
    return this.stripeService.checkout(createStripeDto, req);
  }

  @Post('/checkout/get')
  @UseGuards(AuthGuard)
  checkoutGet(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.checkoutGet(checkoutIdStripeDto);
  }

  @Post('/checkout/get/line-items')
  @UseGuards(AuthGuard)
  checkoutGetLineItems(@Body() checkoutIdStripeDto: CheckoutIdStripeDto) {
    return this.stripeService.checkoutGetLineItems(checkoutIdStripeDto);
  }

  @Post('/webhook')
  postWebhook(@Request() request){
    return this.stripeService.postWebhook(request);
  }
}
