import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Orders, OrderItems } from './entities/orders.entity';
import { Helper } from '../../utils/helper';
import { Users } from '../users/entities/users.entity';
import { BaseService } from '../base/base.service';
import { Products } from '../products/entities/products.entity';

@Injectable()
export class OrdersService extends BaseService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    @InjectRepository(OrderItems)
    private orderItemsRepository: Repository<Orders>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,

    @InjectRepository(Products)
    private productsRepository: Repository<Products>,
  ) {
    super();
  }

  /**
   * Create orders
   * @param createOrderDto
   * @param adminId
   * @returns
   */
  async create(createOrderDto: CreateOrderDto, adminId: number) {
    try {
      const { customer_email, items } = createOrderDto;

      const findUser = await this.usersRepository.findOne({
        where: {
          email: customer_email,
        },
      });

      if (!findUser) {
        throw new NotFoundException('User Not Found.');
      }

      createOrderDto = {
        ...createOrderDto,
        user_id: findUser.id,
        admin_id: adminId,
      };

      const orderItems: OrderItemDto[] = items;

      // if items no repeated by product id, only create order
      const saveOrder = await this.orderRepository.save(createOrderDto);

      if (!saveOrder) {
        throw new NotFoundException('Order Not Found.');
      }

      const orderItemAmountTotalPrice = await this.saveOrderItems(orderItems);

      // sum the order item total price based on order item lists
      const sumOrderItemTotalPrice = orderItemAmountTotalPrice.reduce(
        (acc, item) => acc + item,
        0,
      );

      const updateOrder = await this.orderRepository.update(saveOrder.id, {
        subtotal: sumOrderItemTotalPrice,
        grand_total: sumOrderItemTotalPrice,
      });

      return this.createSuccessResponse(updateOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  private async saveOrderItems(orderItems: OrderItemDto[]) {
    const orderItemAmountTotalPrice = [];

    for (const item of orderItems) {
      // check if product exists on store
      const checkProductExists = await this.productsRepository.findOne({
        where: { id: item.product_id },
      });

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

      // push the amount of order item total price into a lists
      orderItemAmountTotalPrice.push(orderItemTotalPrice);
    }

    return orderItemAmountTotalPrice;
  }

  /**
   * Find all orders by pagination
   * @param allOrderDto
   * @returns
   */
  async findAll(allOrderDto: AllOrderDto) {
    try {
      const findAllOrderResponse = await Helper.calculatePagination<Orders>(
        allOrderDto,
        this.orderRepository,
        null,
        ['items'],
      );

      return this.createSuccessResponse(findAllOrderResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Find specific order
   * @param id
   * @returns
   */
  async findOne(id: number) {
    try {
      const findOrder = await this.orderRepository.findOne({
        where: { id },
        relations: ['items'],
      });

      if (!findOrder) {
        throw new NotFoundException('Order Not Found.');
      }

      return this.createSuccessResponse(findOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
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
    try {
      const findOrder = await this.findOne(id);

      const updateOrder = await this.orderRepository.update(findOrder.data.id, {
        status: updateOrderStatusDto.status,
      });

      return this.createSuccessResponse(updateOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Remove specific order
   * @param id
   * @returns
   */
  async remove(id: number) {
    try {
      const removeOrderResponse = await this.orderRepository.delete(id);
      return this.createSuccessResponse(removeOrderResponse);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }
}
