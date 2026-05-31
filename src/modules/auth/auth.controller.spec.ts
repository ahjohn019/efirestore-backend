import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { METHOD_METADATA } from '@nestjs/common/constants';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signIn: jest.fn(),
            getProfile: jest.fn(),
            forgetPassword: jest.fn(),
            updatePassword: jest.fn(),
            updateAccountPassword: jest.fn(),
            checkResetPasswordPageExpired: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return 200 for update password', () => {
    const statusCode = Reflect.getMetadata(
      '__httpCode__',
      controller.updatePassword,
    );
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      controller.updatePassword,
    );

    expect(statusCode).toBe(200);
    expect(requestMethod).toBe(1);
  });

  it('should return 200 for account password update', () => {
    const statusCode = Reflect.getMetadata(
      '__httpCode__',
      controller.updateAccountPassword,
    );
    const requestMethod = Reflect.getMetadata(
      METHOD_METADATA,
      controller.updateAccountPassword,
    );

    expect(statusCode).toBe(200);
    expect(requestMethod).toBe(1);
  });
});
