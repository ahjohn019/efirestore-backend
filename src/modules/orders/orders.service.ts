import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrderItemsService } from '../order_items/order_items.service';
import { Orders } from './entities/orders.entity';
import { OrderItems } from '../order_items/entities/order_items.entity';
import { Helper } from '../../utils/helper';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,
  ) {}

  @Inject(UsersService)
  private readonly usersService: UsersService;

  @Inject(ProductsService)
  private readonly productsService: ProductsService;

  @Inject(OrderItemsService)
  private readonly orderItemsService: OrderItemsService;

  async create(createOrderDto: CreateOrderDto, user: { id: number }) {
    const findUser = await this.usersService.findOne(createOrderDto.user_id);
    createOrderDto.admin_id = user.id;
    const items: OrderItems[] = createOrderDto.items;
    const orderItemAmountTotalPrice = [];

    if (!findUser) {
      throw new NotFoundException('User Not Found.');
    }

    // find product duplicate
    const checkDuplicateProductIds = Helper.checkDuplicateIdsExists(
      items,
      'product_id',
    );

    const findDuplicateProducts = await this.productsService.findBulk(
      checkDuplicateProductIds,
    );

    // check if duplicate product exists return error
    if (findDuplicateProducts.length !== 0) {
      const fetchProductSku = findDuplicateProducts.map((item) => item.sku);

      const skuDuplicateList = fetchProductSku.join(', ');

      throw new ConflictException(
        `SKU : ${skuDuplicateList} cannot be repeated on current item lists, please resubmit again.`,
      );
    }

    // if items no repeated by product id, only create order
    const saveOrder = await this.orderRepository.save(createOrderDto);

    if (!saveOrder) {
      throw new NotFoundException('Order Not Found.');
    }

    if (createOrderDto.items.length > 0) {
      for (const item of items) {
        const checkProductExists = await this.productsService.findOne(
          item.product_id,
        );

        if (!checkProductExists) {
          throw new NotFoundException('Product Not Found.');
        }

        const orderItemTotalPrice = item.quantity * item.unit_price;
        const result = {
          total_price: orderItemTotalPrice,
          ...item,
        };

        orderItemAmountTotalPrice.push(orderItemTotalPrice);

        await this.orderItemsService.create(result);
      }
    }

    const sumOrderItemTotalPrice = orderItemAmountTotalPrice.reduce(
      (acc, item) => acc + item,
      0,
    );

    const updateOrder = await this.orderRepository.update(saveOrder.id, {
      subtotal: sumOrderItemTotalPrice,
      grand_total: sumOrderItemTotalPrice,
    });

    return updateOrder;
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }

  update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
