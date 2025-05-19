import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from '../services/audit-logs.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(@Query('flagId') flagId?: string) {
    return this.auditLogService.getAuditLogs(flagId);
  }
}
