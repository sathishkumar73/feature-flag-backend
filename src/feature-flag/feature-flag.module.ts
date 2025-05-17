import { Module } from '@nestjs/common';
import { FeatureFlagService } from './services/feature-flag.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeatureFlagController } from './controllers/feature-flag.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
})
export class FeatureFlagModule {}
