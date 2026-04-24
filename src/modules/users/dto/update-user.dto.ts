import { PartialType } from '@nestjs/mapped-types';
import {
  CreateUserDto,
  CreateUserDetailsDto,
  CreateUserAddressDto,
} from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserDetailsDto extends CreateUserDetailsDto {}

export class UpdateUserAddressDto extends PartialType(CreateUserAddressDto) {}
