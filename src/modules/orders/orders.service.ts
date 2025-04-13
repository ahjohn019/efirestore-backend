import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto, orderItemTotalPrice } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Orders } from './entities/orders.entity';
import { Helper } from '../../utils/helper';
import { Users } from '../users/entities/users.entity';
import { BaseService } from '../base/base.service';

@Injectable()
export class OrdersService extends BaseService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
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
      const { customer_email } = createOrderDto;

      const findUser = await this.usersRepository.findOne({
        where: { email: customer_email },
      });

      createOrderDto = {
        ...createOrderDto,
        user_id: findUser.id,
        admin_id: adminId,
      };

      // if items no repeated by product id, only create orders
      const saveOrder = await this.orderRepository.save({
        ...createOrderDto,
        user: findUser,
        items: createOrderDto.items.map((item) => ({
          ...item,
          product: { id: item.product_id },
          total_price: item.unit_price * item.quantity,
        })),
        subtotal: this.calculateTotalPrice(createOrderDto.items),
        grand_total: this.calculateTotalPrice(createOrderDto.items),
      });

      if (!saveOrder) {
        throw new NotFoundException('Order Not Found.');
      }

      return this.createSuccessResponse(saveOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Calculate total price of order items
   * @param orderItems
   * @returns
   */
  calculateTotalPrice(orderItems: orderItemTotalPrice[]): number {
    return orderItems.reduce((total: number, item: orderItemTotalPrice) => {
      return total + item.unit_price * item.quantity;
    }, 0);
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
        relations: ['items', 'user'],
      });

      return this.createSuccessResponse(findOrder);
    } catch (error) {
      return this.createErrorResponse(error.message);
    }
  }

  /**
   * Update order status
   * @param id
   * @param UpdateOrderDto
   * @returns
   */
  async updateOrder(id: number, UpdateOrderDto: UpdateOrderDto) {
    try {
      const findOrder = await this.findOne(id);

      if (!findOrder) {
        throw new NotFoundException('Order Not Found.');
      }

      const updateOrder = await this.orderRepository.update(
        findOrder.data.id,
        UpdateOrderDto,
      );

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
