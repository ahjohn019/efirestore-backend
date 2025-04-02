import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartItemsDto } from './dto/create-carts.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { Carts, CartItems } from './entities/carts.entity';
import { DeleteCartItemDto } from './dto/delete-cart-item.dto';
import { BaseService } from '../base/base.service';
import { Products } from '../products/entities/products.entity';
import { Users } from '../users/entities/users.entity';

@Injectable()
export class CartsService extends BaseService {
  constructor(
    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,

    @InjectRepository(CartItems)
    private cartItemsRepository: Repository<CartItems>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {
    super();
  }

  async findAndCreateCart(userId: number) {
    try {
      const findCart = await this.cartsRepository.findOne({
        where: { user_id: userId },
      });

      if (findCart) {
        return this.createSuccessResponse(findCart);
      }

      const findCartUser = await this.usersRepository.findOne({
        where: { id: userId },
      });

      if (!findCartUser) {
        throw new NotFoundException('User Not Found.');
      }

      const createCart = await this.cartsRepository.save({
        user_id: findCartUser.id,
        cart_session_id: (Math.random() + 1).toString(36).substring(2),
      });

      return this.createSuccessResponse(createCart);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async calculateCartUnitTotalProcess(
    baseQuantity: number,
    findProductInSession: CartItems,
    price: number,
  ) {
    let quantity = findProductInSession?.quantity || baseQuantity;

    if (baseQuantity >= 0) {
      quantity = baseQuantity;
    } else if (baseQuantity <= quantity) {
      quantity =
        baseQuantity <= 0 && Math.abs(baseQuantity) >= quantity
          ? 1
          : quantity - Math.abs(baseQuantity);
    }

    const unitTotal = price * quantity;

    return { quantity, unitTotal };
  }

  async updateCartTotal(userId: number, cartId: number) {
    try {
      // retrieve the current cart items
      const fetchCartItems = await this.cartItemsRepository.find({
        where: { cart_id: cartId },
      });

      // sum the cart total data
      const cartTotal = fetchCartItems.reduce(
        (acc, item) => ({
          unit_total: acc.unit_total + item.unit_total,
          quantity: acc.quantity + item.quantity,
        }),
        { unit_total: 0, quantity: 0 },
      );

      const { unit_total, quantity } = cartTotal;

      // update the subtotal and grand total to the main cart, by the user id
      await this.cartsRepository.update(
        {
          user_id: userId,
        },
        {
          subtotal: unit_total,
          grand_total: unit_total,
          quantity,
        },
      );

      const resultCartUpdated = await this.cartsRepository.findOne({
        where: { id: cartId },
      });

      return this.createSuccessResponse(resultCartUpdated);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async createCartItems(createCartItemsDto: CreateCartItemsDto) {
    const { product_id, cart_session_id } = createCartItemsDto;

    // find and create new cart
    const createCart = await this.findAndCreateCart(createCartItemsDto.user_id);

    // find product exists
    const findProduct = await this.productsRepository.findOne({
      where: { id: product_id },
    });

    // if product not exists, return error messages
    if (!findProduct) {
      throw new NotFoundException('Product Not Found.');
    }

    const { price } = findProduct;

    const findProductInSession = await this.cartItemsRepository.findOne({
      where: { product_id, cart_session_id },
    });

    // calculate the cart quantity
    const resultQuantity = await this.calculateCartUnitTotalProcess(
      createCartItemsDto.quantity,
      findProductInSession,
      price,
    );

    const { quantity, unitTotal } = resultQuantity;

    createCartItemsDto = {
      ...createCartItemsDto,
      quantity,
      unit_price: price,
      unit_total: unitTotal,
      cart_session_id: createCart.data.cart_session_id,
      cart_id: createCart.data.id,
    };

    const { user_id, ...createCartItemsNew } = createCartItemsDto;

    // find the product id and cart session id is same
    const findProductInSessionAfter = await this.cartItemsRepository.findOne({
      where: { product_id: product_id, cart_session_id: cart_session_id },
    });

    // if product in session update data, else create data
    if (findProductInSessionAfter) {
      await this.cartItemsRepository.update(
        findProductInSessionAfter.id,
        createCartItemsNew,
      );
    } else {
      await this.cartItemsRepository.save(createCartItemsDto);
    }

    // update the cart total
    return this.updateCartTotal(user_id, createCartItemsDto.cart_id);
  }

  async viewCartSummary(userId: number) {
    try {
      const viewCartSummary = await this.cartsRepository.findOne({
        where: { user_id: userId },
        relations: ['cart_items', 'user'],
      });

      return this.createSuccessResponse(viewCartSummary);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async deleteCartItem(
    deleteCartItemDto: DeleteCartItemDto,
    request: { id: number },
  ) {
    try {
      const findCartItem = await this.cartItemsRepository.findOne({
        where: {
          cart_id: deleteCartItemDto.cart_id,
          product_id: deleteCartItemDto.product_id,
        },
      });

      if (!findCartItem) {
        throw new NotFoundException('Cart item not found.');
      }

      const deleteCartItem =
        await this.cartItemsRepository.remove(findCartItem);
      const updateCartTotal = await this.updateCartTotal(
        request.id,
        findCartItem.cart_id,
      );

      if (updateCartTotal.data.quantity <= 0) {
        const findCart = await this.cartsRepository.findOne({
          where: {
            id: deleteCartItemDto.cart_id,
            user_id: request.id,
          },
        });

        await this.cartsRepository.remove(findCart);
      }

      return this.createSuccessResponse(deleteCartItem);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async deleteCart(request: { id: number }) {
    try {
      const findCart = await this.cartsRepository
        .findOneOrFail({
          where: { user_id: request.id },
        })
        .catch(() => {
          throw new NotFoundException('Cart not found.');
        });

      await this.cartItemsRepository.delete({
        cart_id: findCart.id,
      });
      await this.cartsRepository.delete(findCart.id);

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}
