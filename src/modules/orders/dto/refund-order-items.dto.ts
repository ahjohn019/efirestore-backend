import { IsNotEmpty, IsEnum } from 'class-validator';
import { OrderStatus } from '../../../enum/order-status.enum';

export class RefundOrderItemsDto {
  @IsNotEmpty()
  order_refund_id: number;

  @IsNotEmpty()
  product_id: number;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: string;
}
