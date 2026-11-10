import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AllOrderDto } from './dto/all-order.dto';
import { CreateOrderDto, orderItemTotalPrice } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Orders } from './entities/orders.entity';
import { Helper } from '../../utils/helper';
import { Users } from '../users/entities/users.entity';
import { BaseService } from '../base/base.service';
import { EasyparcelService } from '../easyparcel/easyparcel.service';
import { buildEasyParcelOrder } from './order.util';

@Injectable()
export class OrdersService extends BaseService {
  constructor(
    @InjectRepository(Orders)
    private orderRepository: Repository<Orders>,

    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    private readonly easyparcelService: EasyparcelService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Create orders
   * @param createOrderDto
   * @param adminId
   * @returns
   */
  async create(createOrderDto: CreateOrderDto, adminId?: number) {
    try {
      const { customer_email } = createOrderDto;

      const findUser = await this.usersRepository.findOne({
        where: { email: customer_email },
      });

      createOrderDto = {
        ...createOrderDto,
        user_id: findUser.id,
        admin_id: adminId ?? 0,
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
        total_quantity: createOrderDto.items.reduce(
          (total: number, item: orderItemTotalPrice) => {
            return total + item.quantity;
          },
          0,
        ),
        subtotal: this.calculateTotalPrice(createOrderDto.items),
        grand_total: this.calculateTotalPrice(createOrderDto.items),
      });

      if (!saveOrder) {
        throw new NotFoundException('Order Not Found.');
      }

      return this.createSuccessResponse(saveOrder);
    } catch (error) {
      throw error;
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
      throw error;
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
      throw error;
    }
  }

  async verifyOrder(orderId: number) {
    const findOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'user', 'user.user_addresses', 'user.user_details'],
    });

    if (!findOrder) {
      throw new NotFoundException('Order Not Found.');
    }

    if (findOrder.status !== 'paid') {
      throw new UnprocessableEntityException('Order must be paid before syncing to EasyParcel.');
    }

    const shippingAddress = findOrder.user.user_addresses.find(
      (address) => address.address_type === 'shipping' && address.status,
    );

    if (!shippingAddress) {
      throw new NotFoundException('Active shipping address not found.');
    }

    const easyParcelOrder = buildEasyParcelOrder(
      findOrder,
      shippingAddress,
      this.configService,
    );

    const response = await this.easyparcelService.submitOrder(easyParcelOrder);
    if (!response?.status) {
      throw new UnprocessableEntityException('EasyParcel synchronization failed.');
    }

    const update = await this.orderRepository.update(findOrder.id, {
      status: 'completed',
      sync_easyparcel: 1,
    });
    if (update.affected === 0) {
      throw new NotFoundException('Order Not Found.');
    }

    return this.createSuccessResponse({
      message: response.data?.message || 'Order synced to EasyParcel successfully.',
      response: response.data,
    });
  }

  async findStripeCheckout(stripeCheckoutId: string) {
    try {
      const findOrder = await this.orderRepository.findOne({
        where: { checkout_stripe_id: stripeCheckoutId },
      });

      return this.createSuccessResponse(findOrder);
    } catch (error) {}
  }

  /**
   * Update order status
   * @param id
   * @param UpdateOrderDto
   * @returns
   */
  async update(id: number, UpdateOrderDto: UpdateOrderDto) {
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
      throw error;
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
      throw error;
    }
  }
}
