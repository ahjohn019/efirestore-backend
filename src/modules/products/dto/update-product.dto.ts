import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNotEmpty, Validate } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  sku: string;

  description: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  category_id: number;
}
