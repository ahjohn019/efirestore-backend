import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StripeService } from './stripe.service';
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
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  checkout(@Body() createStripeDto: CreateStripeDto, @Request() req) {
    return this.stripeService.checkout(createStripeDto, req);
  }

  @Post('/checkout/get')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  checkoutGet(@Request() req) {
    return this.stripeService.checkoutGet(req);
  }

  @Post('/checkout/get/line-items')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  checkoutGetLineItems(@Request() req) {
    return this.stripeService.checkoutGetLineItems(req);
  }

  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  findAll() {
    return this.stripeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stripeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStripeDto: UpdateStripeDto) {
    return this.stripeService.update(+id, updateStripeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stripeService.remove(+id);
  }
}
