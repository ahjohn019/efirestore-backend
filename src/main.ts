import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './commons/filters/http-exception.filter';
import { join } from 'path';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as session from 'express-session';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const port = parseInt(process.env.PORT) || 80;

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useStaticAssets(join(__dirname, '..', 'public'));

  app.use(
    session({
      secret: 'my-session',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Efirestore Backend')
    .setDescription('efirestore ecommerce backend')
    .setVersion('1.0')
    .addTag('ecommerce')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  await app.listen(port, process.env.APP_URL);
}
bootstrap();
