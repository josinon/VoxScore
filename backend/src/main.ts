import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));
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

  if (config.get<string>('SWAGGER_ENABLED') !== 'false') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VoxScore API')
      .setDescription('Megadance / VoxScore — documentação OpenAPI')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, { useGlobalPrefix: true });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
