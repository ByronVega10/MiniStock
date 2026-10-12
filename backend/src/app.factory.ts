import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe, type INestApplication } from '@nestjs/common';

export function configureApplication(app: INestApplication) {
  const config = app.get(ConfigService);
  app.enableCors({ origin: [config.getOrThrow<string>('CORS_ORIGIN')] });
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  }));
  return app;
}

export async function createApplication() {
  return configureApplication(await NestFactory.create(AppModule));
}
