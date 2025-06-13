import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.auditLog.findMany({
        where: flagId ? { flagId } : {},
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      this.prisma.auditLog.count({
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
      throw new Error('User ID is required for audit logging');
    }
    return this.prisma.auditLog.create({
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