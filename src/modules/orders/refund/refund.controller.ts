import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Put,
} from '@nestjs/common';
import { RefundOrderDto } from '../dto/refund-order.dto';
import { AuthGuard } from '../../../commons/guards/auth';
import { RolesGuard } from '../../../commons/guards/roles.guard';
import { Roles } from '../../../commons/decorators/roles.decorator';
import { Role } from '../../../enum/role.enum';
import { OrderRefundService } from './refund.service';
import { UpdateRefundOrderDto } from '../dto/update-refund-order.dto';
@Controller('orders/refund')
export class OrderRefundController {
  constructor(private readonly orderRefundService: OrderRefundService) {}

  /**
   * Get specific order refund id
   * @param req
   * @returns
   */
  @Get(':id')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  findOne(@Request() req) {
    const { id } = req.params;
    console.log('id', id);
    return this.orderRefundService.findOne(id);
  }

  /**
   * Create order refund
   * @param refundOrderDto
   * @returns
   */
  @Post('create')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Body() refundOrderDto: RefundOrderDto) {
    return this.orderRefundService.create(refundOrderDto);
  }

  /**
   * Update order refund
   * @param updateRefundOrderDto
   * @returns
   */
  @Put('update')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  update(@Body() updateRefundOrderDto: UpdateRefundOrderDto) {
    return this.orderRefundService.update(updateRefundOrderDto);
  }
}
