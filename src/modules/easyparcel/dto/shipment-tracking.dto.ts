import { ArrayNotEmpty, IsArray, IsNotEmpty } from 'class-validator';

export class ShipmentTrackingDto {
  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  awb_numbers: string[];
}
