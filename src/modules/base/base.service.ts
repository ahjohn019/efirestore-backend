import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseServiceDto } from './dto/base-service.dto';

@Injectable()
export class BaseService {
  protected createResponse<T>(
    status: string,
    code: number,
    data: T,
  ): BaseServiceDto<T> {
    return {
      status,
      code,
      data,
    };
  }

  protected createSuccessResponse<T>(data: T): BaseServiceDto<T> {
    return this.createResponse('success', 200, data);
  }

  protected createErrorResponse<T>(
    data: T,
    code: number = 500,
  ): BaseServiceDto<T> {
    return this.createResponse('error', code, data);
  }
}
