import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'IsNotWhitespace', async: false })
export class IsNotWhitespace implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    return !/\s/.test(value);
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    const field = validationArguments.property;
    return `${field} cannot be whitespace.`;
  }
}
