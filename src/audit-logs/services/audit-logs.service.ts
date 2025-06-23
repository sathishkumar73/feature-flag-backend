import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BasePrismaService } from '../../common/services/base-prisma.service';

@Injectable()
export class AuditLogService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * Retrieves audit logs owned by a specific user, with optional filtering and pagination.
   */
  async getAuditLogs(query: {
    userId: string;
    flagId?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      userId,
      flagId,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Build the where clause to enforce user scope and optional flagId
    const whereClause: Record<string, any> = { performedById: userId };
    if (flagId) {
      whereClause.flagId = flagId;
    }

    // Parallel fetch of data and count
    const [logs, totalCount] = await Promise.all([
      this.findMany('auditLog', {
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sort]: order },
      }),
      this.count('auditLog', { where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: logs,
      meta: {
        totalCount,
        totalPages,
        currentPage: page,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Logs audit actions (CREATE, UPDATE, DELETE) for feature flags.
   */
  async logAuditAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    flagId: string,
    flagName: string,
    performedById: string,
    details?: object,
  ) {
    if (!performedById) {
      throw new BadRequestException('User ID is required for audit logging');
    }
    return this.create('auditLog', {
      data: {
        action,
        flagId,
        flagName,
        performedById,
        details: details ? JSON.stringify(details) : null,
      },
    });
  }
}
