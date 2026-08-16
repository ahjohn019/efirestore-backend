import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ShipmentAddressDto {
  @IsString()
  @IsNotEmpty()
  postcode: string;

  @IsString()
  @IsNotEmpty()
  subdivison_code: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class ShipmentQuotationItemDto {
  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  sender: ShipmentAddressDto;

  @ValidateNested()
  @Type(() => ShipmentAddressDto)
  receiver: ShipmentAddressDto;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  parcel_value?: number;

  @IsNumber()
  @IsPositive()
  weight: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsNumber()
  @IsPositive()
  length: number;

  @IsNumber()
  @IsPositive()
  height: number;
}

export class ShipmentQuotationDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ShipmentQuotationItemDto)
  shipment: ShipmentQuotationItemDto[];
}
