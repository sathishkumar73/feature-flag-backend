import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';

function isFeatureEnabledForUser(
  userId: string,
  rolloutPercentage: number,
): boolean {
  const hash = createHash('sha256').update(userId).digest('hex');
  const hashNumber = parseInt(hash.substring(0, 8), 16);
  const bucket = hashNumber % 100;
  return bucket < rolloutPercentage;
}

function evaluateAdvancedRules(params: {
  region?: string;
  planType?: string;
  userGroup?: string;
}) {
  // Placeholder Logic
  if (params.region === 'IN' && params.planType === 'premium') {
    return true; // Force enable for Indian Premium Users
  }
  if (params.userGroup === 'beta-testers') {
    return true; // Always enable for beta testers
  }
  return false; // Default to regular rollout logic
}

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  async getFlags(query: {
    environment?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const {
      environment,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
    } = query;

    const [flags, totalCount] = await Promise.all([
      this.prisma.featureFlag.findMany({
        where: environment ? { environment } : {},
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      this.prisma.featureFlag.count({
        where: environment ? { environment } : {},
      }),
    ]);

    const totalPages = Math.ceil(totalCount / Number(limit));
    const currentPage = Number(page);

    return {
      data: flags,
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

  async createFlag(data: {
    name: string;
    description?: string;
    enabled?: boolean;
    environment: string;
  }) {
    const newFlag = await this.prisma.featureFlag.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        environment: data.environment,
      },
    });
    await this.logAuditAction('CREATE', newFlag.id, newFlag.name, 'admin', {
      ...newFlag,
    });
    return newFlag;
  }

  async updateFlag(
    id: string,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
      environment?: string;
    },
  ) {
    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
    await this.logAuditAction(
      'UPDATE',
      updatedFlag.id,
      updatedFlag.name,
      'admin',
      {
        ...updatedFlag,
      },
    );
    return updatedFlag;
  }

  async deleteFlag(id: string) {
    try {
      const flag = await this.prisma.featureFlag.findUnique({
        where: { id },
      });

      if (!flag) {
        throw new Error(`Feature flag with ID ${id} not found.`);
      }

      const deletedFlag = await this.prisma.featureFlag.delete({
        where: { id },
      });

      await this.logAuditAction('DELETE', flag.id, flag.name, 'admin', {
        ...flag,
      });

      return deletedFlag;
    } catch (error) {
      console.error('Error deleting flag:', error);
      throw error;
    }
  }

  async evaluateFlag(flagName: string, userId: string, environment: string) {
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        name: flagName,
        environment,
      },
    });

    if (!flag) {
      throw new Error(
        `Feature flag "${flagName}" not found for environment "${environment}".`,
      );
    }

    const isEnabled =
      flag.enabled && isFeatureEnabledForUser(userId, flag.rolloutPercentage);

    return {
      flagName: flag.name,
      isEnabled,
      rollout: flag.rolloutPercentage,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async evaluateAdvancedFlag(
    flagName: string,
    userId: string,
    environment: string,
    userAttributes: { region?: string; planType?: string; userGroup?: string },
  ) {
    const flag = await this.prisma.featureFlag.findFirst({
      where: {
        name: flagName,
        environment,
      },
    });

    if (!flag) {
      throw new Error(
        `Feature flag "${flagName}" not found for environment "${environment}".`,
      );
    }

    // Check Advanced Rules First
    const forceEnable = evaluateAdvancedRules(userAttributes);

    const isEnabled =
      forceEnable ||
      (flag.enabled && isFeatureEnabledForUser(userId, flag.rolloutPercentage));

    return {
      flagName: flag.name,
      isEnabled,
      rollout: flag.rolloutPercentage,
      evaluatedAt: new Date().toISOString(),
      appliedAdvancedRules: forceEnable,
    };
  }

  async getAuditLogs(flagId?: string) {
    return this.prisma.auditLog.findMany({
      where: flagId ? { flagId } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async logAuditAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    flagId: string,
    flagName: string,
    performedBy: string,
    details?: object,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        flagId,
        flagName,
        performedBy,
        details: details ? JSON.stringify(details) : undefined,
      },
    });
  }
}
