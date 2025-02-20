import { IsNotEmpty } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

export class UpdateOrderStatusDto extends PartialType(CreateOrderDto) {
    @IsNotEmpty()
    status: string;
}