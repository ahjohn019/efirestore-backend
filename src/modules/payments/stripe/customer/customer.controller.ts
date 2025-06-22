import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Put,
  Param
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

  @Get(':id')
  @UseGuards(AuthGuard)
  show(@Param('id') id: number) {
    return this.stripeCustomerService.show(id);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  update(@Body() updateStripeDto: UpdateStripeDto) {
    return this.stripeCustomerService.update(updateStripeDto);
  }
}
