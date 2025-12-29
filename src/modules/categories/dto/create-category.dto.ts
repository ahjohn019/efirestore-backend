import { IsNotEmpty, Validate, MaxLength } from 'class-validator';
import { IsUnique } from '../../../shared/validation/is_unique';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsNotEmpty()
  @Validate(IsUnique, ['categories', 'name'])
  @MaxLength(30)
  @ApiProperty({
    type: String,
    example: "test category 1",
  })
  name: string;
}
