import {
  IsNotEmpty,
  ValidateNested,
  IsObject,
  IsOptional,
} from 'class-validator';

import { Type } from 'class-transformer';

export class AllImageDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  take: number;
}
