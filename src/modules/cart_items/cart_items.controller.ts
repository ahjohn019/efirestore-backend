import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartItemsService } from './cart_items.service';
import { CreateCartItemsDto } from './dto/create-cart_items.dto';
import { UpdateCartItemsDto } from './dto/update-cart_items.dto';
import { AuthGuard } from '../../commons/guards/auth';

@Controller('cart-items')
export class CartItemsController {
  constructor(private readonly cartItemsService: CartItemsService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCartItemDto: CreateCartItemsDto, @Request() req) {
    return this.cartItemsService.create(createCartItemDto, req.user);
  }

  @Get()
  findAll() {
    return this.cartItemsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartItemsService.findOne(+id);
  }

  // @UseGuards(AuthGuard)
  // @Get('users')
  // cartItems(@Request() req) {
  //   console.log('aaaaaaaaaaaaaaaaaaaaa');
  //   return req.user;
  // }

  @Put()
  update(@Body() updateCartItemDto: UpdateCartItemsDto) {
    return this.cartItemsService.update(updateCartItemDto);
  }

  @UseGuards(AuthGuard)
  @Delete()
  remove(@Body() data: { product_ids: number[] }, @Request() req) {
    return this.cartItemsService.removeCartItem(data, req.user);
  }

  @UseGuards(AuthGuard)
  @Delete('remove-all')
  removeAll(@Request() req) {
    return this.cartItemsService.removeAllCartItems(req.user);
  }
}
