import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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

    // find duplicate products with id lists
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

    // if order items exists , create order item lists
    if (createOrderDto.items.length > 0) {
      for (const item of items) {
        // check if product exists on store
        const checkProductExists = await this.productsService.findOne(
          item.product_id,
        );

        // if product not found, return error
        if (!checkProductExists) {
          throw new NotFoundException('Product Not Found.');
        }

        // get order item total price by quantity and unit price
        const orderItemTotalPrice = item.quantity * item.unit_price;

        // combine order item total price with the item lists
        const result = {
          total_price: orderItemTotalPrice,
          ...item,
        };

        // push the amount of order item total price into a lists
        orderItemAmountTotalPrice.push(orderItemTotalPrice);

        // create order items
        await this.orderItemsService.create(result);
      }
    }

    // sum the order item total price based on order item lists
    const sumOrderItemTotalPrice = orderItemAmountTotalPrice.reduce(
      (acc, item) => acc + item,
      0,
    );

    const updateOrder = await this.orderRepository.update(saveOrder.id, {
      subtotal: sumOrderItemTotalPrice,
      grand_total: sumOrderItemTotalPrice,
    });

    return {status: true, data: updateOrder};
  }

  async findAll(allOrderDto: AllOrderDto) {
    return await Helper.calculatePagination<Orders>(
      allOrderDto,
      this.orderRepository,
    );
  }

  async findOne(id: number) {
    const findOrder = await this.orderRepository.findOne({where: {id}})

    if(!findOrder){
      throw new NotFoundException('Order Not Found.');
    }

    return {status: true, data: findOrder};
  }

  async updateOrderStatus(id: number, updateOrderStatusDto: UpdateOrderStatusDto) {
    const findOrder = await this.findOne(id);

    const updateOrder = await this.orderRepository.update(findOrder.data.id, {
      status: updateOrderStatusDto.status,
    });

    return {status: true, data: updateOrder};
  }

  async remove(id: number) {
    return await this.orderRepository.delete(id);
  }
}
