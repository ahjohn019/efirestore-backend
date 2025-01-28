import { PartialType } from '@nestjs/mapped-types';
import { CreateToyyibpayDto } from './create-toyyibpay.dto';

export class UpdateToyyibpayDto extends PartialType(CreateToyyibpayDto) {}
