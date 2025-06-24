import { Module } from '@nestjs/common';
import { GcpController } from './gcp.controller';
import { GcpService } from './gcp.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GcpController],
  providers: [GcpService],
  exports: [GcpService],
})
export class GcpModule {} 