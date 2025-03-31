import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { forgetPasswordDto } from './dto/forgetPassword.dto';
import { updatePasswordDto } from './dto/UpdatePassword.dto';
import { checkResetPasswordExpiredDto } from './dto/checkResetPasswordExpired.dto';

import * as dayjs from 'dayjs';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  async signIn(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = {
      id: user.id,
      username: user.name,
      email: user.email,
      role: user.role,
      status: true,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {
        expiresIn: process.env.JWT_DURATION,
      }),
      status: true,
    };
  }

  sendEmail(email: string, emailLink: string) {
    this.mailService.sendMail({
      from: '"Admin" <' + process.env.EMAIL_ADMIN + '>',
      to: email,
      subject: `Change Password Required`,
      text: emailLink,
    });
  }

  async forgetPassword(forgetPasswordDto: forgetPasswordDto) {
    const user = await this.usersService.findByEmail(forgetPasswordDto.email);

    if (!user) {
      throw new UnauthorizedException('Email Not Found.');
    }

    const generateEmailToken = await bcrypt.hash(user.email, 10);

    const emailLink =
      forgetPasswordDto.url +
      '/resetPassword?token=' +
      generateEmailToken +
      '&id=' +
      user.id;

    await this.usersService.update(user.id, {
      remember_token: generateEmailToken,
    });

    this.sendEmail(forgetPasswordDto.email, emailLink);

    return { status: true, data: emailLink };
  }

  async updatePassword(updatePasswordDto: updatePasswordDto) {
    const user = await this.usersService.findOne(updatePasswordDto.id);

    const generatePasswordHash = await bcrypt.hash(
      updatePasswordDto.password_confirmation,
      10,
    );

    const updatePassword = await this.usersService.update(user.data.id, {
      password: generatePasswordHash,
      remember_token: null,
    });

    return { status: true, data: updatePassword };
  }

  async checkResetPasswordPageExpired(
    checkResetPasswordExpiredDto: checkResetPasswordExpiredDto,
  ) {
    const user = await this.usersService.findOne(
      checkResetPasswordExpiredDto.id,
    );

    const { updated_at, remember_token } = user.data;

    if (!user) {
      throw new UnauthorizedException('User Not Found.');
    }

    const dateNow = dayjs().format('YYYY-MM-DD');
    const dateUpdatedAt = dayjs(updated_at).format('YYYY-MM-DD');
    const fetchDateNow = dayjs(dateNow);

    const diffDays = fetchDateNow.diff(dateUpdatedAt, 'day', true);

    if (diffDays >= 1 && remember_token) {
      throw new ForbiddenException('Page Has Expired');
    }

    return { status: true };
  }
}
