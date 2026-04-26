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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
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

  app.use((req, _res, next) => {
    const requestPath = req.url.split('?')[0];
    const swaggerRoutes = [
      '/api',
      '/api/',
      '/api-json',
      '/api-yaml',
      '/api/favicon-16x16.png',
      '/api/favicon-32x32.png',
      '/api/oauth2-redirect.html',
      '/api/swagger-ui-bundle.js',
      '/api/swagger-ui-init.js',
      '/api/swagger-ui-standalone-preset.js',
      '/api/swagger-ui.css',
    ];

    if (
      requestPath.startsWith('/api/') &&
      !swaggerRoutes.some((route) => requestPath === route)
    ) {
      req.url = req.url.replace(/^\/api/, '');
    }

    next();
  });

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
