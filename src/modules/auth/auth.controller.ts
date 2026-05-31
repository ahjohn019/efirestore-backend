import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Request,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signInDto } from '../auth/dto/signin.dto';
import { forgetPasswordDto } from './dto/forget-password.dto';
import { updatePasswordDto } from './dto/update-password.dto';
import { updateAccountPasswordDto } from './dto/update-account-password.dto';
import { checkResetPasswordExpiredDto } from './dto/check-reset-password-expired.dto';
import { AuthGuard } from '../../commons/guards/auth';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth User')
@ApiBearerAuth()
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: signInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @HttpCode(HttpStatus.OK)
  @Post('admin-login')
  adminSignIn(@Body() signInDto: signInDto) {
    return this.authService.adminSignIn(signInDto.email, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  // forget password
  @Post('forget-password')
  forgetPassword(@Body() forgetPasswordDto: forgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto);
  }

  // update password
  @HttpCode(HttpStatus.OK)
  @Post('update-password')
  updatePassword(@Body() updatePasswordDto: updatePasswordDto) {
    return this.authService.updatePassword(updatePasswordDto);
  }

  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('update-account-password')
  updateAccountPassword(
    @Request() req,
    @Body() updateAccountPasswordDto: updateAccountPasswordDto,
  ) {
    return this.authService.updateAccountPassword(
      req.user.id,
      updateAccountPasswordDto,
    );
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
