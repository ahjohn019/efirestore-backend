import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../modules/users/users.service';

@ValidatorConstraint({ name: 'CurrentPasswordMatched', async: false })
export class CurrentPasswordMatched implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(value: any, args: ValidationArguments) {
    const { object } = args;
    const existUser = await this.usersService.findOne(object['id']);
    if (!existUser) return true;

    const currentPasswordMatch = await bcrypt.compare(
      value,
      existUser.data.password,
    );

    return currentPasswordMatch;
  }

  defaultMessage(validationArguments: ValidationArguments): string {
    const field = validationArguments.property;
    return `${field} does not matched.`;
  }
}
