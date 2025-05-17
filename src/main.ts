import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiKeyGuard } from './common/guards/api-key.guard';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable Validation Globally
  app.useGlobalPipes(new ValidationPipe());

  app.useGlobalGuards(new ApiKeyGuard(app.get(ConfigService)));

  // ✅ Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Feature Flag API')
    .setDescription('API documentation for Feature Flag Platform')
    .setVersion('1.0')
    .addApiKey(
      { type: 'apiKey', name: 'x-api-key', in: 'header' },
      'X-API-KEY',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Accessible at /api-docs

  await app.listen(3000);
}
bootstrap();
