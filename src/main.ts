import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { CorsService } from './common/services/cors.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const corsService = app.get(CorsService);

  app.enableCors({
    origin: async (origin, callback) => {
      if (!origin) return callback(null, true); // Allow non-browser requests
      const allowedOrigins = await corsService.getAllowedOrigins();
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
  });

  // ✅ Enable Validation Globally
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Feature Flag API')
    .setDescription('API documentation for Feature Flag Platform')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'X-API-KEY')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document); // Accessible at /api-docs

  const port = configService.get<number>('PORT') || 4000;
  await app.listen(port);
}
bootstrap();
