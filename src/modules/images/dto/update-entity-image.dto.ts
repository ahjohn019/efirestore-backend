import { IsNotEmpty, IsArray, Validate } from 'class-validator';

export class UpdateEntityImageDto {
  @IsNotEmpty()
  image_id: number;
  @IsNotEmpty()
  category: string;
  @IsNotEmpty()
  entity_id: number;
  @IsNotEmpty()
  entity_type: string;
}
