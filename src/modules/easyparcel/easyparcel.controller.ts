import { createSuccessResponse } from '../base/base.service';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { SubmitOrderDto } from './dto/submit-order.dto';
import { EasyparcelService } from './easyparcel.service';
import { ShipmentTrackingDto } from './dto/shipment-tracking.dto';
import { EasyparcelQueueService } from './easyparcel-queue.service';

@Controller('easyparcel')
export class EasyparcelController {
  constructor(
    private readonly easyparcelService: EasyparcelService,
    private readonly easyparcelQueueService: EasyparcelQueueService,
  ) {}

  @Post('/jobs/sample')
  async enqueueSampleJob() {
    await this.easyparcelQueueService.enqueueSampleJob();

    return createSuccessResponse(true);
  }

  @Get('/jobs/status')
  async getQueueStatus() {
    return {
      status: true,
      data: await this.easyparcelQueueService.getQueueStatus(),
    };
  }

  @Post('/login')
  login(@Body() payload: LoginDto) {
    return this.easyparcelService.login(payload);
  }

  @Post('/stripe/shipment/quotations')
  getStripeShipmentQuotations(@Body() payload: ShipmentQuotationDto) {
    return this.easyparcelService.getStripeShipmentQuotations(payload);
  }

  @Post('/submit/orders')
  submitOrder(@Body() payload: SubmitOrderDto) {
    return this.easyparcelService.submitOrder(payload);
  }

  @Post('/tracking/status')
  fetchTrackingStatus(@Body() payload: ShipmentTrackingDto) {
    return this.easyparcelService.fetchTrackingStatus(payload);
  }
}
