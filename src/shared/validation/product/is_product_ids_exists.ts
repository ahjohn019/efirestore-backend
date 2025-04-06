import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { ProductsService } from '../../../modules/products/products.service';
import { Product } from '../../../utils/product';

@ValidatorConstraint({ async: true })
export class IsProductIdsExists implements ValidatorConstraintInterface {
  private productIdsNotExists: number[];

  constructor(private readonly productsService: ProductsService) {}

  async validate(value: any, args: ValidationArguments) {
    const lineItemIds = await Product.convertToProductIds(
      args.targetName,
      value,
    );

    const findProductIdsNotExists = await Product.findProductIdsNotExists(
      this.productsService,
      lineItemIds,
    );

    this.productIdsNotExists = findProductIdsNotExists;

    return !findProductIdsNotExists || findProductIdsNotExists.length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return `Product Ids ${this.productIdsNotExists} Not Found`;
  }
}
