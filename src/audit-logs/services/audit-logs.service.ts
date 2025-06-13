import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BasePrismaService } from '../../common/services/base-prisma.service';

@Injectable()
export class AuditLogService extends BasePrismaService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async getAuditLogs(query: {
    flagId?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      flagId,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const [logs, totalCount] = await Promise.all([
      this.findMany('auditLog', {
        where: flagId ? { flagId } : {},
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      this.count('auditLog', {
        where: flagId ? { flagId } : {},
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));
    const currentPage = Number(page);

    return {
      data: logs,
      meta: {
        totalCount,
        totalPages,
        currentPage,
        limit: Number(limit),
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

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
