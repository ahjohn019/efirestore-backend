import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ToyyibpayService } from './toyyibpay.service';
import { CreateToyyibpayDto } from './dto/create-toyyibpay.dto';
import { UpdateToyyibpayDto } from './dto/update-toyyibpay.dto';
import { AuthGuard } from '../../../commons/guards/auth';
import { RolesGuard } from '../../../commons/guards/roles.guard';
import { Roles } from '../../../commons/decorators/roles.decorator';
import { Role } from '../../../enum/role.enum';

@Controller('toyyibpay')
export class ToyyibpayController {
  constructor(private readonly toyyibpayService: ToyyibpayService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  create(@Request() req) {
    return this.toyyibpayService.create(req);
  }

  @Post('/create-category')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  createCategory(@Request() req) {
    return this.toyyibpayService.createCategory(req);
  }

  @Post('/get-category')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard, RolesGuard)
  getCategory(@Request() req) {
    return this.toyyibpayService.getCategory(req);
  }

  @Get()
  findAll() {
    return this.toyyibpayService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.toyyibpayService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateToyyibpayDto: UpdateToyyibpayDto,
  ) {
    return this.toyyibpayService.update(+id, updateToyyibpayDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.toyyibpayService.remove(+id);
  }
}
