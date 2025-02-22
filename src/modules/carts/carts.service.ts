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

  async createCartItems(createCartItemsDto: CreateCartItemsDto) {
    // create new cart
    const { product_id, unit_price, cart_session_id } = createCartItemsDto;

    const createCart = await this.findAndCreateCart(createCartItemsDto.user_id);
    const findProduct = await this.productsService.findOne(product_id);

    if (!findProduct) {
      throw new NotFoundException('Product Not Found.');
    }

    const resultQuantity = await this.calculateCartQuantity(
      createCartItemsDto.quantity,
    );

    const unitTotal = unit_price * resultQuantity;

    createCartItemsDto.quantity = resultQuantity;
    createCartItemsDto.unit_total = unitTotal;
    createCartItemsDto.cart_session_id = createCart.data.cart_session_id;

    const { user_id, ...createCartItemsNew } = createCartItemsDto;

    // find if product id and cart session id is same, update the data
    const findProductInSession = await this.cartItemsRepository.findOne({
      where: { product_id: product_id, cart_session_id: cart_session_id },
    });

    if (findProductInSession) {
      await this.cartItemsRepository.update(
        findProductInSession.id,
        createCartItemsNew,
      );
    }

    await this.cartItemsRepository.save(createCartItemsDto);
  }

  ///////////////////////////////////////////////////// old code
  async create(createCartDto: CreateCartDto) {
    const cart = await this.cartsRepository.create(createCartDto);

    return this.cartsRepository.save(cart);
  }

  findAll() {
    return `This action returns all cart`;
  }

  findOne(id: number) {
    return this.cartsRepository.findOne({
      where: {
        id: id,
      },
    });
  }

  findCartSession(session: string) {
    return this.cartsRepository.findOne({
      where: {
        cart_session_id: session,
      },
    });
  }

  findCartUserId(user_id: number) {
    return this.cartsRepository.findOne({
      where: {
        user_id: user_id,
      },
    });
  }

  async update(id: number, updateCartDto: UpdateCartDto) {
    const cartsEntity = await this.findOne(id);
    await this.cartsRepository.save(Object.assign(cartsEntity, updateCartDto));

    return cartsEntity;

    // return `This action updates a #${id} cart`;
  }

  async updateByUserId(user_id: number, updateCartDto: UpdateCartDto) {
    const cartsEntity = await this.findCartUserId(user_id);
    await this.cartsRepository.save(Object.assign(cartsEntity, updateCartDto));

    return cartsEntity;

    // return `This action updates a #${id} cart`;
  }

  remove(id: number) {
    return `This action removes a #${id} cart`;
  }
}
