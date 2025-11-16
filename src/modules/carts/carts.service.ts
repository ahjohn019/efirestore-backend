import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartItemsDto } from './dto/create-carts.dto';
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

  async findCart(userId: number) {
    try {
      const findCart = await this.cartsRepository.findOne({
        where: { user_id: userId },
      });

      if (!findCart) {
        throw new NotFoundException('Cart Not Found.');
      }

      return this.createSuccessResponse(findCart);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
  async createCart(userId: number) {
    try {
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

  calculateCartUnitTotalProcess(
    baseQuantity: number,
    findProductInSession: CartItems,
    price: number,
  ) {
    let quantity = findProductInSession?.quantity || baseQuantity;

    if (baseQuantity >= 0) {
      quantity = baseQuantity;
    } else {
      const adjustedQuantity =
        Math.abs(baseQuantity) >= quantity
          ? 1
          : quantity - Math.abs(baseQuantity);
      quantity = baseQuantity <= 0 ? adjustedQuantity : quantity;
    }

    const unitTotal = price * quantity;

    return { quantity, unitTotal };
  }

  sumCartTotal(fetchCartItems: CartItems[]) {
    return fetchCartItems.reduce(
      (acc, item) => ({
        unit_total: acc.unit_total + item.unit_total,
        quantity: acc.quantity + item.quantity,
      }),
      { unit_total: 0, quantity: 0 },
    );
  }

  async updateCartTotal(userId: number) {
    try {
      // retrieve the current cart items
      const fetchCartItems = await this.cartsRepository.findOne({
        where: { user_id: userId },
        relations: ['cart_items'],
      });

      const cartItems = fetchCartItems?.cart_items ?? [];

      // sum the cart total data
      const cartTotal = this.sumCartTotal(cartItems);

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
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async createCartItems(
    createCartItemsDto: CreateCartItemsDto,
    userId: number,
  ) {
    try {
      const { product_id, cart_session_id } = createCartItemsDto;

      // find and create new cart
      const createCart = await this.findCart(userId);

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
      const resultQuantity = this.calculateCartUnitTotalProcess(
        createCartItemsDto.quantity,
        findProductInSession,
        price,
      );

      const { quantity, unitTotal } = resultQuantity;

      const { ...updateCartItems } = {
        ...createCartItemsDto,
        quantity,
        unit_price: price,
        unit_total: unitTotal,
        cart_session_id: createCart.data.cart_session_id,
        cart_id: createCart.data.id,
      };

      const createCartItems = {
        ...createCartItemsDto,
        quantity,
        unit_price: price,
        unit_total: unitTotal,
        cart_session_id: createCart.data.cart_session_id,
        cart_id: createCart.data.id,
      };

      // if product in session update data, else create data
      if (findProductInSession) {
        await this.cartItemsRepository.update(
          findProductInSession.id,
          updateCartItems,
        );
      } else {
        await this.cartItemsRepository.save(createCartItems);
      }

      // update the cart total
      await this.updateCartTotal(userId);

      const findCarts = await this.cartsRepository.findOne({
        where: { user_id: userId },
        relations: ['cart_items'],
      });

      return this.createSuccessResponse(findCarts);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
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
        relations: ['cart'],
      });

      if (!findCartItem) {
        throw new NotFoundException('Cart item not found.');
      }

      await this.cartItemsRepository.remove(findCartItem);

      await this.updateCartTotal(request.id);

      const countCartItems = findCartItem.cart?.cart_items?.length || 0;

      if (countCartItems <= 0) {
        await this.cartsRepository.delete(findCartItem.cart.id);
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  async deleteCart(userId: number) {
    try {
      const findCart = await this.cartsRepository
        .findOneOrFail({
          where: { user_id: userId },
        })
        .catch(() => {
          throw new NotFoundException('Cart not found.');
        });

      await this.cartsRepository.delete(findCart.id);

      return this.createSuccessResponse(true);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}
