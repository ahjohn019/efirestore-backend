import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { SubmitOrderDto } from './dto/submit-order.dto';
import { EasyparcelService } from './easyparcel.service';
import { ShipmentTrackingDto } from './dto/shipment-tracking.dto';

@Controller('easyparcel')
export class EasyparcelController {
  constructor(private readonly easyparcelService: EasyparcelService) {}

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
