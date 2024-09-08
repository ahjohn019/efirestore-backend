import { IsNotEmpty, Validate, MaxLength } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';

export class CreateCategoryDto {
  @IsNotEmpty()
  @Validate(IsUnique, ['categories', 'name'])
  @MaxLength(30)
  name: string;
}
