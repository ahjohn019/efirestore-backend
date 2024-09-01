import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { forgetPasswordDto } from './dto/forgetPassword.dto';
import { updatePasswordDto } from './dto/UpdatePassword.dto';

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
    const passwordMatch = await bcrypt.compare(pass, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload = { username: user.name, email: user.email };

    return {
      access_token: await this.jwtService.signAsync(payload),
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
      process.env.APP_URL +
      '/reset-password?token=' +
      generateEmailToken +
      '&id=' +
      user.id;

    await this.usersService.update(user.id, {
      remember_token: generateEmailToken,
    });

    this.sendEmail(forgetPasswordDto.email, emailLink);

    return emailLink;
  }

  async updatePassword(updatePasswordDto: updatePasswordDto) {
    const user = await this.usersService.findOne(updatePasswordDto.id);

    const generatePasswordHash = await bcrypt.hash(
      updatePasswordDto.password_confirmation,
      10,
    );

    const updatePassword = await this.usersService.update(user.id, {
      password: generatePasswordHash,
      remember_token: null,
    });

    return updatePassword;
  }
}
