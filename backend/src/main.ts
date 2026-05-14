import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const corsOrigins = config
    .get<string>('CORS_ORIGINS')
    ?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins?.length) {
    app.enableCors({
      origin: corsOrigins,
      credentials: true,
    });
  } else {
    app.enableCors();
  }
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
