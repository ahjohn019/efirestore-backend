import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailerService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findOne: jest.fn(),
    findByResetPasswordToken: jest.fn(),
    update: jest.fn(),
    updateByResetPasswordToken: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    sendMail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    mailService = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    const mockUser = {
      data: {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user',
      },
    };

    const mockToken = 'mock.jwt.token';

    it('should successfully sign in a user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('test@example.com', 'password123');

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBe(mockToken);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should return error when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ data: null });

      await expect(
        service.signIn('nonexistent@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return error when password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.signIn('test@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgetPassword', () => {
    const mockForgetPasswordDto = {
      email: 'test@example.com',
      url: 'http://example.com',
    };

    const mockUser = {
      data: {
        id: 1,
        email: 'test@example.com',
      },
    };

    it('should successfully send forget password email', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedToken'));
      mockUsersService.update.mockResolvedValue({ success: true });
      mockUsersService.findByEmail
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          data: {
            ...mockUser.data,
            reset_password_token: 'hashedToken',
          },
        });
      mockMailService.sendMail.mockResolvedValue({ success: true });

      const result = await service.forgetPassword(mockForgetPasswordDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        mockForgetPasswordDto.email,
      );
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockMailService.sendMail).toHaveBeenCalled();
    });

    it('should return error when email not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ data: null });

      await expect(
        service.forgetPassword(mockForgetPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updatePassword', () => {
    const mockUpdatePasswordDto = {
      reset_password_token: 'valid-token',
      new_password: 'newPassword',
      password_confirmation: 'newPassword',
    };

    const mockUser = {
      data: {
        id: 1,
        reset_password_expired_at: dayjs().add(1, 'hour').format(),
      },
    };

    it('should successfully update password', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedPassword'));
      mockUsersService.update.mockResolvedValue({ success: true });

      const result = await service.updatePassword(mockUpdatePasswordDto);

      expect(result).toEqual({ success: true });
      expect(mockUsersService.findByResetPasswordToken).toHaveBeenCalledWith(
        mockUpdatePasswordDto.reset_password_token,
      );
      expect(mockUsersService.update).toHaveBeenCalledWith(1, {
        password: 'hashedPassword',
        reset_password_token: null,
        reset_password_expired_at: null,
      });
    });

    it('should reject an invalid reset password token', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue({
        data: null,
      });

      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should clear an expired reset password token', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue({
        data: {
          id: 1,
          reset_password_expired_at: dayjs().subtract(1, 'minute').format(),
        },
      });

      await expect(
        service.updatePassword(mockUpdatePasswordDto),
      ).rejects.toThrow(BadRequestException);
      expect(mockUsersService.updateByResetPasswordToken).toHaveBeenCalledWith(
        mockUpdatePasswordDto.reset_password_token,
        {
          reset_password_token: null,
          reset_password_expired_at: null,
        },
      );
    });
  });

  describe('checkResetPasswordPageExpired', () => {
    const mockCheckResetPasswordExpiredDto = {
      reset_password_token: 'valid-token',
    };

    const mockUser = {
      data: {
        id: 1,
        reset_password_expired_at: dayjs().subtract(2, 'day').format(),
      },
    };

    it('should return true when reset password page is valid', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue({
        data: {
          ...mockUser.data,
          reset_password_expired_at: dayjs().add(1, 'hour').format(),
        },
      });

      const result = await service.checkResetPasswordPageExpired(
        mockCheckResetPasswordExpiredDto,
      );

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBe(true);
    });

    it('should return error when page has expired', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue(mockUser);

      await expect(
        service.checkResetPasswordPageExpired(mockCheckResetPasswordExpiredDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return error when user not found', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue({
        data: null,
      });

      await expect(
        service.checkResetPasswordPageExpired(mockCheckResetPasswordExpiredDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
