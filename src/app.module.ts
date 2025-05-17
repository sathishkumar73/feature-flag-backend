import { Module } from '@nestjs/common';
import { FeatureFlagModule } from './feature-flag/feature-flag.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), FeatureFlagModule, PrismaModule],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
