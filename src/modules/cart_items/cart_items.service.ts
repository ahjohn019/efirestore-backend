import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateCartItemsDto } from './dto/create-cart_items.dto';
import { UpdateCartItemsDto } from './dto/update-cart_items.dto';
import { ProductsService } from '../products/products.service';
import { CartsService } from '../carts/carts.service';
import { CartItems } from './entities/cart_items.entity';
import { AuthGuard } from '../../commons/guards/auth';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectRepository(CartItems)
    private cartsItemsRepository: Repository<CartItems>,

    private readonly productsService: ProductsService,

    private readonly cartsService: CartsService,
  ) {}

  async create(createCartItemDto: CreateCartItemsDto, user: { id: number }) {
    const product = await this.productsService.findOne(
      createCartItemDto.product_id,
    );

    const userId = user.id;
    const checkAuthUserCart = await this.cartsService.findCartUserId(userId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!checkAuthUserCart) {
      const initQuantity =
        createCartItemDto.quantity > 0 ? createCartItemDto.quantity : 1;

      const subtotal = createCartItemDto.unit_price * initQuantity;

      const createCart = await this.cartsService.create({
        quantity: initQuantity,
        subtotal: subtotal,
        grand_total: subtotal,
        user_id: userId,
      });

      createCartItemDto.cart_session_id = createCart.cart_session_id;
      createCartItemDto.unit_total = subtotal;
      createCartItemDto.quantity = initQuantity;

      const cartItems = this.cartsItemsRepository.create(createCartItemDto);
      return this.cartsItemsRepository.save(cartItems);
    }

    // find cart items & update carts items quantity
    const findCartItemByProduct = await this.cartsItemsRepository.findOne({
      where: {
        product_id: createCartItemDto.product_id,
      },
    });

    // create cart items if product is not found
    if (!findCartItemByProduct) {
      await this.cartsItemsRepository.save({
        product_id: createCartItemDto.product_id,
        cart_session_id: checkAuthUserCart.cart_session_id,
        quantity: createCartItemDto.quantity,
        unit_price: createCartItemDto.unit_price,
        unit_total: createCartItemDto.unit_price * createCartItemDto.quantity,
        created_at: new Date(),
        updated_at: new Date(),
      });

      return this.updateMainCart(checkAuthUserCart);
    }

    if (createCartItemDto.quantity < 0) {
      findCartItemByProduct.quantity -= Math.abs(createCartItemDto.quantity);
    } else {
      findCartItemByProduct.quantity = createCartItemDto.quantity;
    }

    if (findCartItemByProduct.quantity <= 0) {
      findCartItemByProduct.quantity = 1;
    }

    findCartItemByProduct.unit_total =
      findCartItemByProduct.unit_price * findCartItemByProduct.quantity;

    await this.cartsItemsRepository.update(
      { id: findCartItemByProduct.id },
      {
        quantity: findCartItemByProduct.quantity,
        unit_total: findCartItemByProduct.unit_total,
      },
    );

    return this.updateMainCart(checkAuthUserCart);
  }

  findAll() {
    return `This action returns all cartItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} cartItem`;
  }

  async updateMainCart(checkAuthUserCart: {
    cart_session_id: string;
    user_id: number;
  }) {
    // find cart items based on session id
    const cartItemList = await this.cartsItemsRepository.find({
      where: {
        cart_session_id: checkAuthUserCart.cart_session_id,
      },
    });

    const { totalQuantity, totalUnit } = cartItemList.reduce(
      (acc, item) => {
        acc.totalQuantity += item.quantity;
        acc.totalUnit += item.unit_total;
        return acc;
      },
      { totalQuantity: 0, totalUnit: 0 },
    );

    // find main cart and update subtotal & grand total & total quantity
    this.cartsService.updateByUserId(checkAuthUserCart.user_id, {
      user_id: checkAuthUserCart.user_id,
      quantity: totalQuantity,
      subtotal: totalUnit,
      grand_total: totalUnit,
      cart_session_id: checkAuthUserCart.cart_session_id,
    });

    return cartItemList;
  }

  async update(updateCartItemDto: UpdateCartItemsDto) {
    return `This action update #${updateCartItemDto} cartItem`;
  }

  async removeCartItem(data: { product_ids: number[] }, user: { id: number }) {
    // find cart id on database
    const userId = user.id;
    const checkAuthUserCart = await this.cartsService.findCartUserId(userId);

    // find item id based on cart id
    const findCartItemByProduct = await this.cartsItemsRepository.find({
      where: {
        cart_session_id: checkAuthUserCart.cart_session_id,
        product_id: In(data.product_ids),
      },
    });

    // return failed message if cart item is empty
    if (findCartItemByProduct.length <= 0) {
      return `Remove cartItem failed`;
    }

    // remove the cart item based on specific ids
    await this.cartsItemsRepository.remove(findCartItemByProduct);
    return this.updateMainCart(checkAuthUserCart);
  }

  async removeAllCartItems(user: { id: number }) {
    // find cart id on database
    const userId = user.id;
    const checkAuthUserCart = await this.cartsService.findCartUserId(userId);

    // remove all item based on cart id
    await this.cartsItemsRepository.delete({
      cart_session_id: checkAuthUserCart.cart_session_id,
    });

    // update main cart qty and total to zero
    this.cartsService.updateByUserId(checkAuthUserCart.user_id, {
      user_id: checkAuthUserCart.user_id,
      quantity: 0,
      subtotal: 0,
      grand_total: 0,
      cart_session_id: checkAuthUserCart.cart_session_id,
    });

    return await this.cartsItemsRepository.find({
      where: {
        cart_session_id: checkAuthUserCart.cart_session_id,
      },
    });
  }
}
