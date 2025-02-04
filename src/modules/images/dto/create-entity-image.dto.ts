import { IsNotEmpty, Validate } from 'class-validator';

export class CreateEntityImageDto {
  @IsNotEmpty()
  category: string;
  @IsNotEmpty()
  entity_id: number;
  @IsNotEmpty()
  entity_type: string;
}
