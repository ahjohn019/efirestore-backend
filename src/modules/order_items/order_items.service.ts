import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderItemDto } from './dto/create-order_item.dto';
import { UpdateOrderItemDto } from './dto/update-order_item.dto';
import { OrderItems } from '../order_items/entities/order_items.entity';

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItems)
    private orderItemsRepository: Repository<OrderItems>,
  ) {}

  async create(createOrderItemDto: CreateOrderItemDto) {
    const saveOrderItem =
      await this.orderItemsRepository.save(createOrderItemDto);

    console.log('saveOrderItem', saveOrderItem);

    return 'This action adds a new orderItem';
  }

  findAll() {
    return `This action returns all orderItems`;
  }

  findOne(id: number) {
    return `This action returns a #${id} orderItem`;
  }

  update(id: number, updateOrderItemDto: UpdateOrderItemDto) {
    return `This action updates a #${id} orderItem`;
  }

  remove(id: number) {
    return `This action removes a #${id} orderItem`;
  }
}
