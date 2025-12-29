import { IsNotEmpty } from 'class-validator';

export class AllOrderDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  take: number;
}
