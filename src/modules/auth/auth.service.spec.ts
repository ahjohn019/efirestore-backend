import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as dayjs from 'dayjs';
import { Role } from 'src/enum/role.enum';

const dayjsFn = (dayjs as any).default ?? dayjs;

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let mailService: MailerService;
  const originalEnv = process.env;

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
    process.env = { ...originalEnv };

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
    process.env = originalEnv;
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
        role: Role.USER,
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

    it('should reject admin users on user login', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        data: {
          ...mockUser.data,
          role: Role.ADMIN,
        },
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await expect(
        service.signIn('test@example.com', 'password123'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should successfully sign in an admin user', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        data: {
          ...mockUser.data,
          role: Role.ADMIN,
        },
      });
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.adminSignIn(
        'test@example.com',
        'password123',
      );

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBe(mockToken);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should reject non-admin users on admin login', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await expect(
        service.adminSignIn('test@example.com', 'password123'),
      ).rejects.toThrow(ForbiddenException);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
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
      process.env.APP_MODE = 'local';
      process.env.FRONTEND_URL = 'http://efirestore';
      process.env.FRONTEND_URL_PORT = '8081';
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed/Token+='));
      mockUsersService.update.mockResolvedValue({ success: true });
      mockUsersService.findByEmail
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          data: {
            ...mockUser.data,
            reset_password_token: 'hashed/Token+=',
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
      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            resetUrl:
              'http://efirestore/reset-password?token=hashed%2FToken%2B%3D',
          }),
        }),
      );
    });

    it('should add reset password slash when frontend url has no trailing slash', async () => {
      process.env.APP_MODE = 'staging';
      process.env.FRONTEND_URL = 'https://staging.efirestore.com';
      delete process.env.FRONTEND_URL_PORT;
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('$2b$10$abc'));
      mockUsersService.update.mockResolvedValue({ success: true });
      mockUsersService.findByEmail
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          data: {
            ...mockUser.data,
            reset_password_token: '$2b$10$abc',
          },
        });
      mockMailService.sendMail.mockResolvedValue({ success: true });

      await service.forgetPassword(mockForgetPasswordDto);

      expect(mockMailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            resetUrl:
              'https://staging.efirestore.com/reset-password?token=%242b%2410%24abc',
          }),
        }),
      );
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
        reset_password_expired_at: dayjsFn().add(1, 'hour').format(),
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
      expect(mockUsersService.update).not.toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          password: mockUpdatePasswordDto.new_password,
        }),
      );
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
        reset_password_expired_at: dayjsFn().subtract(1, 'minute').format(),
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

  describe('getProfile', () => {
    it('should return the authenticated user profile with related data', async () => {
      const mockProfile = {
        id: 1,
        email: 'test@example.com',
        user_addresses: [{ id: 10, user_id: 1 }],
      };

      mockUsersService.findOne.mockResolvedValue({
        status: 'success',
        code: 200,
        data: mockProfile,
      });

      const result = await service.getProfile(1);

      expect(result).toEqual({
        status: 'success',
        code: 200,
        data: mockProfile,
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });

    it('should throw when the authenticated user profile is missing', async () => {
      mockUsersService.findOne.mockResolvedValue({ data: null });

      await expect(service.getProfile(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAccountPassword', () => {
    const mockUpdateAccountPasswordDto = {
      current_password: 'ahrui123',
      new_password: '1111aaaa',
      password_confirmation: '1111aaaa',
    };

    const mockUser = {
      data: {
        id: 1,
        password: 'hashedCurrentPassword',
      },
    };

    it('should successfully update the authenticated user password', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedNewPassword'));
      mockUsersService.update.mockResolvedValue({ success: true });

      const result = await service.updateAccountPassword(
        1,
        mockUpdateAccountPasswordDto,
      );

      expect(result).toEqual({ success: true });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
      expect(mockUsersService.update).toHaveBeenCalledWith(1, {
        password: 'hashedNewPassword',
      });
      expect(mockUsersService.update).not.toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          password: mockUpdateAccountPasswordDto.new_password,
        }),
      );
    });

    it('should reject when the current password does not match', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        service.updateAccountPassword(1, mockUpdateAccountPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockUsersService.update).not.toHaveBeenCalled();
    });

    it('should reject when the authenticated user is not found', async () => {
      mockUsersService.findOne.mockResolvedValue({ data: null });

      await expect(
        service.updateAccountPassword(1, mockUpdateAccountPasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('checkResetPasswordPageExpired', () => {
    const mockCheckResetPasswordExpiredDto = {
      reset_password_token: 'valid-token',
    };

    const mockUser = {
      data: {
        id: 1,
        reset_password_expired_at: dayjsFn().subtract(2, 'day').format(),
      },
    };

    it('should return true when reset password page is valid', async () => {
      mockUsersService.findByResetPasswordToken.mockResolvedValue({
        data: {
          ...mockUser.data,
          reset_password_expired_at: dayjsFn().add(1, 'hour').format(),
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
