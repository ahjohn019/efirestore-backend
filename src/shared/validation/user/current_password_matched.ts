import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../modules/users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as dayjs from 'dayjs';

@ValidatorConstraint({ name: 'CurrentPasswordMatched', async: false })
export class CurrentPasswordMatched implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  async validate(value: any, args: ValidationArguments) {
    const { object } = args;

    const existUser = await this.usersService.findByResetPasswordToken(
      object['reset_password_token'],
    );

    if (!existUser.data) {
      throw new NotFoundException('You have reset password already.');
    }

    const resetPasswordExpiredAt = dayjs(
      existUser.data.reset_password_expired_at,
    ).format('YYYY-MM-DD HH:ss');

    const dateTimeNow = dayjs();
    const checkDateTimeNowIsAfterResetPasswordExpired = dayjs(
      dateTimeNow,
    ).isAfter(resetPasswordExpiredAt);

    if (checkDateTimeNowIsAfterResetPasswordExpired) {
      await this.usersService.updateByResetPasswordToken(
        object['reset_password_token'],
        {
          reset_password_token: null,
          reset_password_expired_at: null,
        },
      );

      throw new BadRequestException(
        'Reset password expired, please reset password again.',
      );
    }

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
