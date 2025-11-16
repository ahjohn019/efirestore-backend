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
import { CreateCartItemsDto } from './dto/create-carts.dto';
import { DeleteCartItemDto } from './dto/delete-cart-item.dto';
import { AuthGuard } from '../../commons/guards/auth';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
@Controller('cart')
@ApiTags('Carts')
@ApiBearerAuth()
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get('find-cart/:id')
  @UseGuards(AuthGuard)
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
  })
  findCart(@Param('id') id: number) {
    return this.cartsService.findCart(id);
  }

  @Post('create-cart')
  @UseGuards(AuthGuard)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: 'The ID of the user',
        },
      },
    },
  })
  createCart(@Request() req) {
    return this.cartsService.createCart(req.user.id);
  }

  @Post('create-cart-items')
  @UseGuards(AuthGuard)
  createCartItems(
    @Body() createCartItemsDto: CreateCartItemsDto,
    @Request() req,
  ) {
    return this.cartsService.createCartItems(createCartItemsDto, req.user.id);
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
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'number',
          example: 1,
          description: 'The ID of the user',
        },
      },
    },
  })
  deleteCart(@Body() cart: { userId: number }) {
    return this.cartsService.deleteCart(cart.userId);
  }
}
