import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { TokenCheck } from '../../shared/validation/user/token_check';
import { CurrentPasswordMatched } from '../../shared/validation/user/current_password_matched';

import * as dotenv from 'dotenv';
dotenv.config();

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET_KEY,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenCheck, CurrentPasswordMatched],
})
export class AuthModule {}
