import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class AllCategoryDto {
  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 1,
  })
  page: number;

  @IsNotEmpty()
  @ApiProperty({
    type: Number,
    example: 1,
  })
  take: number;
}
