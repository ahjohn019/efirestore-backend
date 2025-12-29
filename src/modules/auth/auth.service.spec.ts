import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
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
    update: jest.fn(),
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
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.signIn('test@example.com', 'password123');

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBe(mockToken);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should return error when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.signIn('nonexistent@example.com', 'password123');

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('User not found');
    });

    it('should return error when password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await service.signIn('test@example.com', 'wrongpassword');

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Invalid email or password');
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
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedToken'));
      mockUsersService.update.mockResolvedValue({ success: true });
      mockMailService.sendMail.mockResolvedValue({ success: true });

      const result = await service.forgetPassword(mockForgetPasswordDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(mockForgetPasswordDto.email);
      expect(mockUsersService.update).toHaveBeenCalled();
      expect(mockMailService.sendMail).toHaveBeenCalled();
    });

    it('should return error when email not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgetPassword(mockForgetPasswordDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Email Not Found.');
    });
  });

  describe('updatePassword', () => {
    const mockUpdatePasswordDto = {
      id: 1,
      token: 'valid-token',
      current_password: 'currentPassword',
      new_password: 'newPassword',
      password_confirmation: 'newPassword',
    };

    const mockUser = {
      data: {
        id: 1,
      },
    };

    it('should successfully update password', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedPassword'));
      mockUsersService.update.mockResolvedValue({ success: true });

      const result = await service.updatePassword(mockUpdatePasswordDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(mockUpdatePasswordDto.id);
      expect(mockUsersService.update).toHaveBeenCalled();
    });
  });

  describe('checkResetPasswordPageExpired', () => {
    const mockCheckResetPasswordExpiredDto = {
      id: 1,
    };

    const mockUser = {
      data: {
        id: 1,
        updated_at: dayjs().subtract(2, 'day').format(),
        remember_token: 'someToken',
      },
    };

    it('should return true when reset password page is valid', async () => {
      mockUsersService.findOne.mockResolvedValue({
        data: {
          ...mockUser.data,
          updated_at: dayjs().format(),
        },
      });

      const result = await service.checkResetPasswordPageExpired(mockCheckResetPasswordExpiredDto);

      expect(result.status).toBe('success');
      expect(result.code).toBe(200);
      expect(result.data).toBe(true);
    });

    it('should return error when page has expired', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.checkResetPasswordPageExpired(mockCheckResetPasswordExpiredDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('Page Has Expired');
    });

    it('should return error when user not found', async () => {
      mockUsersService.findOne.mockResolvedValue({ data: null });

      const result = await service.checkResetPasswordPageExpired(mockCheckResetPasswordExpiredDto);

      expect(result.status).toBe('error');
      expect(result.code).toBe(500);
      expect(result.data).toBe('User Not Found.');
    });
  });
});
