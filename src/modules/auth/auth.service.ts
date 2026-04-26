import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { forgetPasswordDto } from './dto/forget-password.dto';
import { updatePasswordDto } from './dto/update-password.dto';
import { checkResetPasswordExpiredDto } from './dto/check-reset-password-expired.dto';
import { BaseService } from '../base/base.service';

import * as dayjs from 'dayjs';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthService extends BaseService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {
    super();
  }

  async signIn(userEmail: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(userEmail);
      if (!user.data) {
        throw new UnauthorizedException('User not found');
      }
      const { password, id, name, email, role, user_details } = user.data;
      const passwordMatch = await bcrypt.compare(pass, password);
      if (!passwordMatch) {
        throw new UnauthorizedException('Invalid email or password');
      }
      const payload = {
        id,
        username: name,
        email,
        role,
        status: true,
        user_details,
      };
      console.log('payload', payload);
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_DURATION,
      });
      return this.createSuccessResponse(accessToken);
    } catch (error) {
      throw error;
    }
  }

  async sendEmail(email: string, emailLink: string) {
    try {
      const sendEmailResponse = await this.mailService.sendMail({
        from: '"Admin" <' + process.env.EMAIL_ADMIN + '>',
        to: email,
        subject: `Change Password Required`,
        template: 'reset-password',
        context: {
          subject: 'Change Password Required',
          email,
          resetUrl: emailLink,
          company: 'E-firestore',
        },
      });

      return this.createSuccessResponse(sendEmailResponse);
    } catch (error) {
      throw error;
    }
  }

  async forgetPassword(forgetPasswordDto: forgetPasswordDto) {
    try {
      const user = await this.usersService.findByEmail(forgetPasswordDto.email);

      if (!user.data) {
        throw new UnauthorizedException('Email Not Found.');
      }

      const { id, email } = user.data;

      const generateResetPasswordToken = await bcrypt.hash(email, 10);
      const emailTokenExpiresAt = dayjs()
        .add(1, 'hour')
        .format('YYYY-MM-DD HH:mm:ss');

      await this.usersService.update(id, {
        reset_password_token: generateResetPasswordToken,
        reset_password_expired_at: emailTokenExpiresAt,
      });

      const findAfterResetEmail = await this.usersService.findByEmail(
        forgetPasswordDto.email,
      );

      const emailLink =
        process.env.FRONTEND_URL +
        'reset-password' +
        '?token=' +
        findAfterResetEmail.data.reset_password_token;

      await this.sendEmail(forgetPasswordDto.email, emailLink);

      return this.createSuccessResponse(emailLink);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(updatePasswordDto: updatePasswordDto) {
    try {
      const user = await this.usersService.findByResetPasswordToken(
        updatePasswordDto.reset_password_token,
      );

      if (!user || !user.data) {
        throw new ForbiddenException('Reset password not allowed.');
      }

      const resetPasswordExpiredAt = dayjs(user.data.reset_password_expired_at);

      if (
        !resetPasswordExpiredAt.isValid() ||
        dayjs().isAfter(resetPasswordExpiredAt)
      ) {
        await this.usersService.updateByResetPasswordToken(
          updatePasswordDto.reset_password_token,
          {
            reset_password_token: null,
            reset_password_expired_at: null,
          },
        );

        throw new BadRequestException(
          'Reset password expired, please reset password again.',
        );
      }

      const generatePasswordHash = await bcrypt.hash(
        updatePasswordDto.new_password,
        10,
      );

      const updatePassword = await this.usersService.update(user.data.id, {
        password: generatePasswordHash,
        reset_password_token: null,
        reset_password_expired_at: null,
      });
      return updatePassword;
    } catch (error) {
      throw error;
    }
  }

  async checkResetPasswordPageExpired(
    checkResetPasswordExpiredDto: checkResetPasswordExpiredDto,
  ) {
    try {
      const user = await this.usersService.findByResetPasswordToken(
        checkResetPasswordExpiredDto.reset_password_token,
      );

      if (!user || !user.data) {
        throw new UnauthorizedException('Reset password not allowed.');
      }

      const resetPasswordExpiredAt = dayjs(user.data.reset_password_expired_at);

      if (
        !resetPasswordExpiredAt.isValid() ||
        dayjs().isAfter(resetPasswordExpiredAt)
      ) {
        await this.usersService.updateByResetPasswordToken(
          checkResetPasswordExpiredDto.reset_password_token,
          {
            reset_password_token: null,
            reset_password_expired_at: null,
          },
        );

        throw new ForbiddenException('Page Has Expired');
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      throw error;
    }
  }
}
