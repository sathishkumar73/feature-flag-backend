import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { AuditLogService } from '../services/audit-logs.service';
import { ApiSecurity, ApiTags, ApiOperation, ApiResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from 'src/common/guards/jwt-or-apikey.guard';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('audit-logs')
@UseGuards(JwtOrApiKeyGuard)
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get audit logs with optional filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of audit logs' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async getAuditLogs(
    @Query('flagId') flagId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Page must be a positive number');
    }

    if (isNaN(limitNum) || limitNum < 1) {
      throw new BadRequestException('Limit must be a positive number');
    }

    return this.auditLogService.getAuditLogs({
      flagId,
      page: pageNum,
      limit: limitNum,
      sort,
      order,
    });
  }
}
