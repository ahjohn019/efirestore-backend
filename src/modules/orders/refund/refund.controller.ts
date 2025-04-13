import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { RefundOrderDto } from '../dto/refund-order.dto';
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
  create(refundOrderDto: RefundOrderDto) {
    return this.orderRefundService.create(refundOrderDto);
  }
}
