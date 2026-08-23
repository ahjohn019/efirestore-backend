import { IsInt, IsPositive } from 'class-validator';

export class ShipmentTrackingDto {
  @IsInt()
  @IsPositive()
  order_id: number;
}
