import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Product } from '../../../utils/product';
import { Helper } from '../../../utils/helper';
import { ProductsService } from '../../../modules/products/products.service';

@ValidatorConstraint({ async: true })
export class IsDuplicateProducts implements ValidatorConstraintInterface {
  private findDuplicateProducts: string;

  constructor(private readonly productsService: ProductsService) {}

  async validate(value: any, args: ValidationArguments) {
    const lineItemIds = await Product.convertToProductIds(
      'CreateStripeDto',
      value,
    );

    const findDuplicateIds = Helper.checkDuplicateIdsExists(lineItemIds);

    this.findDuplicateProducts = await Product.findDuplicateProductSkus(
      this.productsService,
      findDuplicateIds,
    );

    return (
      !this.findDuplicateProducts || this.findDuplicateProducts.length === 0
    );
  }

  defaultMessage(args: ValidationArguments) {
    return `SKU: ${this.findDuplicateProducts} cannot be repeated on current item lists, please resubmit again.`;
  }
}
