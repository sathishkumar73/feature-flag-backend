import { Module } from '@nestjs/common';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuditLogModule } from './audit-logs/audit-logs.module';
import { PlaygroundModule } from './playground/playground.module';
import { ApiKeyModule } from './api-key/api-key.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FeatureFlagModule,
    PrismaModule,
    AuditLogModule,
    PlaygroundModule,
    ApiKeyModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
