import { MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const isLocal = process.env.APP_MODE === 'local';

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: isLocal ? process.env.MAILTRAP_HOST : process.env.EMAIL_HOST,
    port: Number(
      isLocal
        ? (process.env.MAILTRAP_PORT ?? 2525)
        : (process.env.EMAIL_PORT ?? 587),
    ),
    secure: isLocal
      ? process.env.MAILTRAP_SECURE === 'true'
      : process.env.EMAIL_SECURE === 'true',
    auth: {
      user: isLocal
        ? process.env.MAILTRAP_USERNAME
        : process.env.EMAIL_USERNAME,
      pass: isLocal
        ? process.env.MAILTRAP_PASSWORD
        : process.env.EMAIL_PASSWORD,
    },
  },
  template: {
    dir:
      process.env.APP_MODE !== 'production'
        ? join(process.cwd(), 'src/templates')
        : join(__dirname, '..', 'templates'),
    adapter: new PugAdapter(),
    options: {
      strict: true,
    },
  },
});
