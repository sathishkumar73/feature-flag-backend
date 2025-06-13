import { Module } from '@nestjs/common';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuditLogModule } from './audit-logs/audit-logs.module';
import { PlaygroundModule } from './playground/playground.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { AuthModule } from './auth/auth.module';
import { CorsService } from './common/services/cors.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FeatureFlagModule,
    PrismaModule,
    AuditLogModule,
    PlaygroundModule,
    ApiKeyModule,
    AuthModule,
  ],
  controllers: [],
  providers: [PrismaService, CorsService],
  exports: [CorsService],
})
export class AppModule {}
