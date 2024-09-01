import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchPasswords', async: false })
export class MatchPasswords implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const object = args.object as any;
    return value === object[relatedPropertyName];
  }

  defaultMessage(args: ValidationArguments) {
    return 'Passwords do not match!';
  }
}
