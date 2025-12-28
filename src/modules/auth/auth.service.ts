import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { forgetPasswordDto } from './dto/forgetPassword.dto';
import { updatePasswordDto } from './dto/UpdatePassword.dto';
import { checkResetPasswordExpiredDto } from './dto/checkResetPasswordExpired.dto';
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

      const { password, id, name, email, role } = user.data;

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
      };

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

      if (!user) {
        throw new UnauthorizedException('Email Not Found.');
      }

      const { id, email } = user.data;

      const generateEmailToken = await bcrypt.hash(email, 10);

      const emailLink =
        process.env.FRONTEND_URL +
        'reset-password' +
        '?user_id=' +
        id +
        '&email=' +
        email;

      await this.usersService.update(id, {
        remember_token: generateEmailToken,
      });

      this.sendEmail(forgetPasswordDto.email, emailLink);

      return this.createSuccessResponse(emailLink);
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(updatePasswordDto: updatePasswordDto, reqUser) {
    try {
      const user = await this.usersService.findOne(reqUser.id);

      const generatePasswordHash = await bcrypt.hash(
        updatePasswordDto.password_confirmation,
        10,
      );

      const updatePassword = await this.usersService.update(user.data.id, {
        password: generatePasswordHash,
        remember_token: null,
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
      const user = await this.usersService.findOne(
        checkResetPasswordExpiredDto.id,
      );

      if (!user || !user.data) {
        throw new UnauthorizedException('User Not Found.');
      }

      const { updated_at, remember_token } = user.data;

      const dateNow = dayjs().format('YYYY-MM-DD');
      const dateUpdatedAt = dayjs(updated_at).format('YYYY-MM-DD');
      const fetchDateNow = dayjs(dateNow);

      const diffDays = fetchDateNow.diff(dateUpdatedAt, 'day', true);

      if (diffDays >= 1 && remember_token) {
        throw new ForbiddenException('Page Has Expired');
      }

      return this.createSuccessResponse(true);
    } catch (error) {
      throw error;
    }
  }
}
