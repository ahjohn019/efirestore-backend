import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from 'src/modules/users/entities/users.entity';

@ValidatorConstraint({ name: 'IsUserEmail', async: true })
export class IsUserEmail implements ValidatorConstraintInterface {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async validate(value: string, args?: ValidationArguments) {
    const { object } = args;
    const customerEmail = object.hasOwnProperty('customer_email')
      ? object['customer_email']
      : null;

    const findUserByEmail = await this.usersRepository.findOne({
      where: { email: customerEmail },
    });

    if (!findUserByEmail) return false;

    return true;
  }

  defaultMessage?(validationArguments?: ValidationArguments): string {
    const field = validationArguments.property;
    return `${field} not found.`;
  }
}
