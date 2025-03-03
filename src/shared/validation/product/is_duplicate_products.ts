import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { Product } from '../../../utils/product'; // Assuming Product helper is in this path
import { Helper } from '../../../utils/helper'; // Assuming Helper is in this path

@ValidatorConstraint({ async: true })
export class IsDuplicateProducts implements ValidatorConstraintInterface {
  
  async validate(value: any, args: ValidationArguments) {
    // console.log('value', value.map((lineItem) => lineItem.price_data?.product_data?.metadata?.id ?? []));
    console.log('value', value.lineItemIds);
    console.log('args', args);




    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Duplicate products are not allowed in line_items';
  }
}
