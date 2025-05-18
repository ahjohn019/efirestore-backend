import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from 'src/enum/order-status.enum';

export class UpdateRefundOrderDto {
  @IsNotEmpty()
  order_id: number;

  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: string;

  @IsNotEmpty()
  is_stripe_enabled: boolean;
}
