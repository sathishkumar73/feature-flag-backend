import { Module } from '@nestjs/common';
import { FeatureFlagService } from './services/feature-flag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagController } from './controllers/feature-flag.controller';
import { AuditLogModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
})
export class FeatureFlagModule {}
