import { PartialType } from '@nestjs/mapped-types';
import {
  CreateUserDto,
  CreateUserDetailsDto,
  CreateUserAddressDto,
} from './create-user.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserDetailsDto extends CreateUserDetailsDto {
  @IsNotEmpty()
  id: number;
}

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {
  @IsNotEmpty()
  id: number;
}
