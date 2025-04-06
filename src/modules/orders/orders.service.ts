import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
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
        subtotal: createOrderDto.items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0,
        ),
        grand_total: createOrderDto.items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0,
        ),
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

      if (!findOrder) {
        throw new NotFoundException('Order Not Found.');
      }

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
