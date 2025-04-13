import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from 'src/enum/order-status.enum';

export class UpdateRefundOrderDto {
  @IsNotEmpty()
  id: number;

  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: string;
}
