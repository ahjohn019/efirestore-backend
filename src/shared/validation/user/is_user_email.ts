import {
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';
import { UsersService } from '../../../modules/users/users.service';

@ValidatorConstraint({ name: 'IsUserEmail', async: true })
export class IsUserEmail implements ValidatorConstraintInterface {
    constructor(private readonly usersService: UsersService) {}

    async validate(value: string, args?: ValidationArguments){
        const { object } = args;
        const customerEmail = object.hasOwnProperty('customer_email') ? object['customer_email'] : null;
        const findUserByEmail = await this.usersService.findByEmail(customerEmail);
        if(!findUserByEmail) return false;

        return true;
    }

    defaultMessage?(validationArguments?: ValidationArguments): string {
        const field = validationArguments.property;
        return `${field} not found.`;
    }
}