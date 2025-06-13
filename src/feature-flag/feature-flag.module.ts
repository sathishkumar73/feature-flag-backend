import { Module, forwardRef } from '@nestjs/common';
import { FeatureFlagService } from './services/feature-flag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { AuditLogModule } from '../audit-logs/audit-logs.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { JwtOrApiKeyGuard } from '../common/guards/jwt-or-apikey.guard';

@Module({
  imports: [PrismaModule, AuditLogModule, forwardRef(() => ApiKeyModule)],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, JwtOrApiKeyGuard],
})
export class FeatureFlagModule {}
