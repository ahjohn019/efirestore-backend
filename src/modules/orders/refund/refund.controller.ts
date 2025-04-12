import { Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../../commons/guards/auth';
import { RolesGuard } from '../../../commons/guards/roles.guard';
import { Roles } from '../../../commons/decorators/roles.decorator';
import { Role } from '../../../enum/role.enum';
import { OrderRefundService } from './refund.service';

@Controller('orders/refund')
export class OrderRefundController {
  constructor(private readonly orderRefundService: OrderRefundService) {}

  @Post('create')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  create() {
    return this.orderRefundService.create();
  }
}
