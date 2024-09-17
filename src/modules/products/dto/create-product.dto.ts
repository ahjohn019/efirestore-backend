import { IsNotEmpty, Validate } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';
import { IsNotWhitespace } from 'src/shared/validation/is_not_whitespace';

export class CreateProductDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @Validate(IsUnique, ['products', 'sku'])
  @Validate(IsNotWhitespace, ['sku'])
  sku: string;

  description: string;

  @IsNotEmpty()
  price: number;

  @IsNotEmpty()
  category_id: number;

  image_category: string;
}
