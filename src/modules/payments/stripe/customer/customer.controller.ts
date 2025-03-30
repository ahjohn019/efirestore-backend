import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { AuthGuard } from 'src/commons/guards/auth';
import { StripeCustomerService } from 'src/modules/payments/stripe/customer/customer.service';
import { CustomerStripeDto } from '../dto/customer-stripe.dto';
import { BaseStripeService } from '../base-stripe.service';
import { ConfigService } from '@nestjs/config';
import { UpdateStripeDto } from '../dto/update-stripe.dto';

@Controller('stripe/customer')
export class StripeCustomerController extends BaseStripeService {
  constructor(
    private readonly stripeCustomerService: StripeCustomerService,
    protected configService: ConfigService,
  ) {
    super(configService);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  create(@Body() customerStripeDto: CustomerStripeDto) {
    return this.stripeCustomerService.create(customerStripeDto);
  }

  @Post('')
  @UseGuards(AuthGuard)
  show(@Body() body: { id: number }) {
    return this.stripeCustomerService.show(body.id);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  update(@Body() updateStripeDto: UpdateStripeDto) {
    return this.stripeCustomerService.update(updateStripeDto);
  }
}
