import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path as needed
import { AuditLogsController } from './controllers/audit-logs.controller';
import { AuditLogService } from './services/audit-logs.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditLogService, PrismaService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
