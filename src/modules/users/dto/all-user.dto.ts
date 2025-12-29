import { IsNotEmpty } from 'class-validator';

export class AllUserDto {
  @IsNotEmpty()
  page: number;

  @IsNotEmpty()
  take: number;
}
