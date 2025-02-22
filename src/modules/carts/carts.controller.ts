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
import { CartsService } from './carts.service';
import { CreateCartDto, CreateCartItemsDto } from './dto/create-carts.dto';
import { DeleteCartItemDto } from './dto/delete-cart-item.dto';
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

  @Delete('delete-cart-item')
  @UseGuards(AuthGuard)
  deleteCartItem(@Body() deleteCartItemDto: DeleteCartItemDto, @Request() req) {
    return this.cartsService.deleteCartItem(deleteCartItemDto, req.user);
  }

  @Delete('delete-cart')
  @UseGuards(AuthGuard)
  deleteCart(@Request() req) {
    return this.cartsService.deleteCart(req.user);
  }
}
