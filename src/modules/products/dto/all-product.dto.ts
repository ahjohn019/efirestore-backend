import { IsNotEmpty } from 'class-validator';

export class AllProductDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  total: number;
}
