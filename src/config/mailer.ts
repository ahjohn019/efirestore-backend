import { MailerOptions } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

export const mailerConfig = (): MailerOptions => ({
  transport: {
    host: process.env.EMAIL_HOST,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
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
