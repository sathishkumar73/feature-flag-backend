import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from '../services/audit-logs.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(
    @Query('flagId') flagId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.auditLogService.getAuditLogs({
      flagId,
      page: isNaN(pageNum) ? 1 : pageNum,
      limit: isNaN(limitNum) ? 10 : limitNum,
      sort,
      order,
    });
  }
}
