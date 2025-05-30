import { Module } from '@nestjs/common';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuditLogModule } from './audit-logs/audit-logs.module';
import { PlaygroundModule } from './playground/playground.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    FeatureFlagModule,
    PrismaModule,
    AuditLogModule,
    PlaygroundModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
