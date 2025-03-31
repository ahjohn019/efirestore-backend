import { IsNotEmpty } from 'class-validator';

export class AllCategoryDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  take: number;
}
