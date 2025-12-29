import {
  IsNotEmpty,
  ValidateNested,
  IsObject,
  IsOptional,
  IsBoolean,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';

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

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  search: Boolean;
}
