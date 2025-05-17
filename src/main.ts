import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Enable Validation Globally
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Feature Flag API')
    .setDescription('API documentation for Feature Flag Platform')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Accessible at /api-docs

  await app.listen(3000);
}
bootstrap();
