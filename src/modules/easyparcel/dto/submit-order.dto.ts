import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class SubmitOrderInsurancePurchaseDto {
  @IsInt()
  @IsPositive()
  insurance_service_id: number;

  @IsUrl()
  invoices: string;

  @IsOptional()
  @IsUrl()
  photos?: string;
}

export class SubmitOrderItemDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsPositive()
  weight: number;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsNumber()
  @IsPositive()
  length: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsString()
  @IsNotEmpty()
  currency_code: string;

  @IsNumber()
  @Min(0)
  value: number;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubmitOrderInsurancePurchaseDto)
  insurance_purchase?: SubmitOrderInsurancePurchaseDto;
}

export class SubmitOrderAddressDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone_number_country_code: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsOptional()
  @IsString()
  alternate_phone_number?: string;

  @IsOptional()
  @IsString()
  alternate_phone_number_country_code?: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsString()
  @IsNotEmpty()
  address_1: string;

  @IsOptional()
  @IsString()
  address_2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  subdivision_code: string;

  @IsString()
  @IsNotEmpty()
  postcode: string;

  @IsString()
  @IsNotEmpty()
  country_code: string;
}

export class SubmitOrderCodDto {
  @IsString()
  cod_amount: string;

  @IsString()
  cod_currency: string;
}

export class SubmitOrderFeatureDto {
  @ValidateNested()
  @Type(() => SubmitOrderCodDto)
  cod: SubmitOrderCodDto;

  @IsBoolean()
  email_tracking: boolean;

  @IsIn([0, 1])
  whatsapp_tracking: 0 | 1;

  @IsBoolean()
  awb_branding: boolean;
}

export class SubmitOrderShipmentDto {
  @IsString()
  @IsNotEmpty()
  service_id: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  collection_date: string;

  @IsNumber()
  @IsPositive()
  weight: number;

  @IsNumber()
  @IsPositive()
  height: number;

  @IsNumber()
  @IsPositive()
  length: number;

  @IsNumber()
  @IsPositive()
  width: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitOrderItemDto)
  item: SubmitOrderItemDto[];

  @ValidateNested()
  @Type(() => SubmitOrderAddressDto)
  sender: SubmitOrderAddressDto;

  @ValidateNested()
  @Type(() => SubmitOrderAddressDto)
  receiver: SubmitOrderAddressDto;

  @ValidateNested()
  @Type(() => SubmitOrderFeatureDto)
  feature: SubmitOrderFeatureDto;
}

export class SubmitOrderDto {
  order_id: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubmitOrderShipmentDto)
  shipment: SubmitOrderShipmentDto[];
}

export interface EasyParcelError {
  status?: number;
  message?: string;
}
