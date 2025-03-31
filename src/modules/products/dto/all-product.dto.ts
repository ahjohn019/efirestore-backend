import {
  IsNotEmpty,
  ValidateNested,
  IsObject,
  IsOptional,
} from 'class-validator';

import { Type } from 'class-transformer';

class CategoryCondition {
  @IsNotEmpty()
  slug: string;
}

class Condition {
  @ValidateNested()
  @Type(() => CategoryCondition)
  categories: CategoryCondition;
}

export class AllProductDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  take: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => Condition)
  condition?: Condition;
}
