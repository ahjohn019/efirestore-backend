import { MailerOptions } from '@nestjs-modules/mailer';

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
});
