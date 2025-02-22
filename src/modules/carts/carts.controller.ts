import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Session,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto, CreateCartItemsDto } from './dto/create-carts.dto';
import { AuthGuard } from '../../commons/guards/auth';
@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post('find-cart/:id')
  @UseGuards(AuthGuard)
  findAndCreateCart(@Param('id') userId: number) {
    return this.cartsService.findAndCreateCart(userId);
  }

  @Post('create-cart-items')
  @UseGuards(AuthGuard)
  createCartItems(@Body() createCartItemsDto: CreateCartItemsDto) {
    return this.cartsService.createCartItems(createCartItemsDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  viewCartSummary(@Request() req) {
    return this.cartsService.viewCartSummary(req.user.id);
  }
}
