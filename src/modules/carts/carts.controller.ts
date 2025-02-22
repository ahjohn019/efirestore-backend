import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Session,
} from '@nestjs/common';
import { CartsService } from './carts.service';
import { CreateCartDto, CreateCartItemsDto } from './dto/create-carts.dto';
import { UpdateCartDto } from './dto/update-carts.dto';

@Controller('cart')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post('find-cart/:id')
  findAndCreateCart(@Param('id') userId: number) {
    return this.cartsService.findAndCreateCart(userId);
  }

  @Post('create-cart-items')
  createCartItems(@Body() createCartItemsDto: CreateCartItemsDto) {
    return this.cartsService.createCartItems(createCartItemsDto);
  }

  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartsService.create(createCartDto);
  }

  @Get()
  findAll() {
    return this.cartsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartsService.update(+id, updateCartDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartsService.remove(+id);
  }
}
