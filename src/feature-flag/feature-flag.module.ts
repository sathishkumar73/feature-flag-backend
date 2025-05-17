import { Module } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';
import { PrismaModule } from '../prisma/prisma.module';  // Import this

@Module({
  imports: [PrismaModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService],
})
export class FeatureFlagModule {}
