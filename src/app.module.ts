import { Module } from '@nestjs/common';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuditLogModule } from './audit-logs/audit-logs.module';
import { ApiKeyModule } from './api-key/api-key.module';
import { AuthModule } from './auth/auth.module';
import { CorsService } from './common/services/cors.service';
import { JwtOrApiKeyGuard } from './common/guards/jwt-or-apikey.guard';
import { WaitListSignupModule } from './wait-list-signup/wait-list-signup.module';
import { MarketingModule } from './marketing/marketing.module';
import { GcpModule } from './gcp/gcp.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FeatureFlagModule,
    PrismaModule,
    AuditLogModule,
    ApiKeyModule,
    AuthModule,
    WaitListSignupModule,
    MarketingModule,
    GcpModule,
  ],
  controllers: [],
  providers: [PrismaService, CorsService, JwtOrApiKeyGuard],
  exports: [CorsService],
})
export class AppModule {}
