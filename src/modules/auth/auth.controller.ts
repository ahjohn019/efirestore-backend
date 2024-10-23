import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Param,
  Get,
  Request,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signInDto } from '../auth/dto/signin.dto';
import { forgetPasswordDto } from './dto/forgetPassword.dto';
import { updatePasswordDto } from './dto/UpdatePassword.dto';
import { checkResetPasswordExpiredDto } from './dto/checkResetPasswordExpired.dto';
import { AuthGuard } from '../../commons/guards/auth';
import { Users } from '../users/entities/users.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: signInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req, user: Users) {
    return req.user;
  }

  // forget password
  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: forgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  // update password
  @Post('update-password')
  updatePassword(@Body() updatePasswordDto: updatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @Post('check-reset-password-expired')
  checkResetPasswordPageExpired(
    @Body() checkResetPasswordExpiredDto: checkResetPasswordExpiredDto,
  ) {
    return this.authService.checkResetPasswordPageExpired(
      checkResetPasswordExpiredDto,
    );
  }
}
