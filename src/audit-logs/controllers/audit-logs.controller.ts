import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { AuditLogService } from '../services/audit-logs.service';
import {
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { RequestWithUser } from '../../auth/types/request-with-user.type';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('audit-logs')
@UseGuards(JwtOrApiKeyGuard)
export class AuditLogsController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get audit logs belonging to the authenticated user',
  })
  @ApiQuery({ name: 'flagId', required: false, example: '123' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated list of audit logs for this user',
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  async getAuditLogs(
    @Req() req: RequestWithUser,
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

    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in request');
    }

    return this.auditLogService.getAuditLogs({
      userId,
      flagId,
      page: pageNum,
      limit: limitNum,
      sort,
      order,
    });
  }
}
