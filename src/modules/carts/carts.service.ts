import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartDto, CreateCartItemsDto } from './dto/create-carts.dto';
import { UpdateCartDto } from './dto/update-carts.dto';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { Carts, CartItems } from './entities/carts.entity';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Carts)
    private cartsRepository: Repository<Carts>,

    @InjectRepository(CartItems)
    private cartItemsRepository: Repository<CartItems>,
  ) {}

  @Inject(ProductsService)
  private readonly productsService: ProductsService;

  @Inject(UsersService)
  private readonly usersService: ProductsService;

  async findAndCreateCart(userId: number) {
    const findCart = await this.cartsRepository.findOne({
      where: { user_id: userId },
    });

    if (!findCart) {
      const findCartUser = await this.usersService.findOne(userId);

      if (!findCartUser) {
        throw new NotFoundException('User Not Found.');
      }

      const createCart = await this.cartsRepository.save({
        user_id: userId,
        cart_session_id: (Math.random() + 1).toString(36).substring(2),
      });

      return { status: true, data: createCart };
    }

    return { status: true, data: findCart };
  }

  async calculateCartQuantity(baseQuantity: number) {
    let calculateQuantity: number;

    if (baseQuantity < 0) {
      calculateQuantity -= Math.abs(baseQuantity);
    } else {
      calculateQuantity = baseQuantity;
    }

    if (baseQuantity <= 0) {
      calculateQuantity = 1;
    }

    return calculateQuantity;
  }

  async updateCartTotal(userId: number, cartSessionId: string) {
    // retrieve the current cart items
    const fetchCartItems = await this.cartItemsRepository.find({
      where: { cart_session_id: cartSessionId },
    });

    // sum the cart total data
    const cartTotal = fetchCartItems.reduce(
      (acc, item) => ({
        unit_total: acc.unit_total + item.unit_total,
        quantity: acc.quantity + item.quantity,
      }),
      { unit_total: 0, quantity: 0 },
    );

    // update the subtotal and grand total to the main cart, by the user id
    const updateSelectedCart = await this.cartsRepository.update(
      {
        user_id: userId,
      },
      {
        subtotal: cartTotal.unit_total,
        grand_total: cartTotal.unit_total,
        quantity: cartTotal.quantity,
      },
    );

    return { status: true, data: updateSelectedCart };
  }

  async createCartItems(createCartItemsDto: CreateCartItemsDto) {
    const { product_id, unit_price, cart_session_id } = createCartItemsDto;

    // find and create new cart
    const createCart = await this.findAndCreateCart(createCartItemsDto.user_id);

    // find product exists
    const findProduct = await this.productsService.findOne(product_id);

    // if product not exists, return error messages
    if (!findProduct) {
      throw new NotFoundException('Product Not Found.');
    }

    // calculate the cart quantity
    const resultQuantity = await this.calculateCartQuantity(
      createCartItemsDto.quantity,
    );

    const unitTotal = unit_price * resultQuantity;

    createCartItemsDto.quantity = resultQuantity;
    createCartItemsDto.unit_total = unitTotal;
    createCartItemsDto.cart_session_id = createCart.data.cart_session_id;

    const { user_id, ...createCartItemsNew } = createCartItemsDto;

    // find the product id and cart session id is same
    const findProductInSession = await this.cartItemsRepository.findOne({
      where: { product_id: product_id, cart_session_id: cart_session_id },
    });

    // if product in session update data, else create data
    if (findProductInSession) {
      await this.cartItemsRepository.update(
        findProductInSession.id,
        createCartItemsNew,
      );
    } else {
      await this.cartItemsRepository.save(createCartItemsDto);
    }

    // update the cart total
    return this.updateCartTotal(user_id, cart_session_id);
  }
}
