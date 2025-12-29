import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../../modules/users/users.service';
import * as bcrypt from 'bcrypt';

@ValidatorConstraint({ name: 'TokenCheck', async: true })
@Injectable()
export class TokenCheck implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(token: string, args: ValidationArguments) {
    const { object } = args;

    if (object['id'] !== null) {
      const existUser = await this.usersService.findOne(object['id']);
      if (!existUser) return true;

      const generateEmailToken = await bcrypt.hash(existUser.data.email, 10);
      await this.usersService.update(object['id'], {
        remember_token: generateEmailToken,
      });

      const findUserById = await this.usersService.findOne(object['id']);

      token = findUserById.data.remember_token;
    }

    const user = await this.usersService.findByToken(token);
    return !!user;
  }

  defaultMessage(args: ValidationArguments) {
    return 'User with the provided token does not exist';
  }
}
