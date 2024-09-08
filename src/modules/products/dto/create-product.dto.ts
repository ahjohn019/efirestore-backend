import { IsNotEmpty, Validate } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';

export class CreateProductDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @Validate(IsUnique, ['products', 'sku'])
  sku: string;

  description: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  category_id: number;
}
