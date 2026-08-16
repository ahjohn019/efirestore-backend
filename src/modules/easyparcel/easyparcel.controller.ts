import { Body, Controller, Post } from '@nestjs/common';
import { LoginEasyparcelDto } from './dto/login-easyparcel.dto';
import { ShipmentQuotationDto } from './dto/shipment-quotation.dto';
import { EasyparcelService } from './easyparcel.service';

@Controller('easyparcel')
export class EasyparcelController {
  constructor(private readonly easyparcelService: EasyparcelService) {}

  @Post('/login')
  login(@Body() payload: LoginEasyparcelDto) {
    return this.easyparcelService.login(payload);
  }

  @Post('/stripe/shipment/quotations')
  getStripeShipmentQuotations(@Body() payload: ShipmentQuotationDto) {
    return this.easyparcelService.getStripeShipmentQuotations(payload);
  }
}
