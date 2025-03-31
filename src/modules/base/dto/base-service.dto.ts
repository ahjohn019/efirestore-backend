export class BaseServiceDto<T> {
  status: string;
  code: number;
  data: T;
}