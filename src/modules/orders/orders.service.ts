import {
  Injectable,
  Inject,
  NotFoundException,
  ConflictException,
  forwardRef,
} from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProductsService } from '../products/products.service';
import { Orders, OrderItems } from './entities/orders.entity';
import { Helper } from '../../utils/helper';
import { Product } from '../../utils/product';
import { Users } from '../users/entities/users.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    @InjectRepository(OrderItems)
    private orderItemsRepository: Repository<Orders>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    private readonly productsService: ProductsService,
  ) {}

  /**
   * Create orders
   * @param createOrderDto
   * @param adminId
   * @returns
   */
  async create(createOrderDto: CreateOrderDto, adminId: number) {
    const { customer_email, items } = createOrderDto;

    const findUser = await this.usersRepository.findOne({
      where: {
        email: customer_email,
      },
    });

    if (!findUser) {
      throw new NotFoundException('User Not Found.');
    }

    createOrderDto.user_id = findUser.id;
    createOrderDto.admin_id = adminId;

    const orderItems: OrderItemDto[] = items;
    const orderItemAmountTotalPrice = [];

    // find duplicate product ids
    const orderItemIds = orderItems.map((item) => item.product_id);

    const checkDuplicateProductIds =
      Helper.checkDuplicateIdsExists(orderItemIds);

    // find duplicate product
    const findDuplicateProduct = await Product.findDuplicateProductSkus(
      this.productsService,
      checkDuplicateProductIds,
    );

    if (findDuplicateProduct) {
      throw new ConflictException(
        `SKU : ${findDuplicateProduct} cannot be repeated on current item lists, please resubmit again.`,
      );
    }

    // if items no repeated by product id, only create order
    const saveOrder = await this.orderRepository.save(createOrderDto);

    if (!saveOrder) {
      throw new NotFoundException('Order Not Found.');
    }

    // if order items exists , create order item lists
    if (items.length > 0) {
      for (const item of orderItems) {
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
        const result: OrderItemDto = {
          total_price: orderItemTotalPrice,
          ...item,
        };

        // push the amount of order item total price into a lists
        orderItemAmountTotalPrice.push(orderItemTotalPrice);

        // create order items
        await this.orderItemsRepository.save(result);
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

    return { status: true, data: updateOrder };
  }

  /**
   * Find all orders by pagination
   * @param allOrderDto
   * @returns
   */
  async findAll(allOrderDto: AllOrderDto) {
    return await Helper.calculatePagination<Orders>(
      allOrderDto,
      this.orderRepository,
      null,
      ['items'],
    );
  }

  /**
   * Find specific order
   * @param id
   * @returns
   */
  async findOne(id: number) {
    const findOrder = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!findOrder) {
      throw new NotFoundException('Order Not Found.');
    }

    return { status: true, data: findOrder };
  }

  /**
   * Update order status
   * @param id
   * @param updateOrderStatusDto
   * @returns
   */
  async updateOrderStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const findOrder = await this.findOne(id);

    const updateOrder = await this.orderRepository.update(findOrder.data.id, {
      status: updateOrderStatusDto.status,
    });

    return { status: true, data: updateOrder };
  }

  /**
   * Remove specific order
   * @param id
   * @returns
   */
  async remove(id: number) {
    return await this.orderRepository.delete(id);
  }
}
