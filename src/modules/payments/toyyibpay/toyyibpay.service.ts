import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateToyyibpayDto } from './dto/create-toyyibpay.dto';
import { UpdateToyyibpayDto } from './dto/update-toyyibpay.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Injectable()
export class ToyyibpayService {
  private readonly userSecretKey;
  private readonly baseUrl;

  constructor(
    @Inject('TOYYIB_PAYMENT_URL')
    private readonly toyyibPayService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userSecretKey = {
      userSecretKey: this.configService.get<string>(
        'TOYYIB_PAYMENT_SECRET_KEY',
      ),
    };
    this.baseUrl = this.configService.get<string>('TOYYIB_MAIN_URL');
  }

  async createCategory(req: any) {
    const result = Object.assign(this.userSecretKey, req.body);
    const response = await firstValueFrom(
      this.toyyibPayService.post('createCategory', result, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    return { status: true, data: response.data };
  }

  async getCategory(req: any) {
    const result = Object.assign(this.userSecretKey, req.body);
    const response = await firstValueFrom(
      this.toyyibPayService.post('getCategoryDetails', result, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    if (!response.data.CategoryName) {
      throw new NotFoundException('Category Not Found.');
    }

    return { status: true, data: response.data };
  }

  async create(req: any) {
    const findCategory = await this.getCategory({
      categoryCode: req.categoryCode,
    });

    if (!findCategory.data.CategoryName) {
      throw new NotFoundException('Category Not Found.');
    }

    const payload = {
      ...this.userSecretKey,
      ...req.body,
    };

    const response = await firstValueFrom(
      this.toyyibPayService.post('createBill', payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
    );

    const billCode = response.data[0]?.BillCode ?? null;

    if (!billCode) {
      throw new NotFoundException('Payment Url Not Found');
    }

    return {
      status: true,
      data: `${this.baseUrl}${billCode}`,
    };
  }

  findAll() {
    return `This action returns all toyyibpay`;
  }

  findOne(id: number) {
    return `This action returns a #${id} toyyibpay`;
  }

  update(id: number, updateToyyibpayDto: UpdateToyyibpayDto) {
    return `This action updates a #${id} toyyibpay`;
  }

  remove(id: number) {
    return `This action removes a #${id} toyyibpay`;
  }
}
