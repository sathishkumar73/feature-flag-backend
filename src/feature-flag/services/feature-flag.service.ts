import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashUserToBucket } from '../../utils/hash';
import { AuditLogService } from '../../audit-logs/services/audit-logs.service';

@Injectable()
export class FeatureFlagService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  private async isFlagEnabledForUser(
    flagId: string,
    userId: string,
  ): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { id: flagId },
    });

    if (!flag) {
      throw new Error('Feature flag not found');
    }

    if (!flag.enabled) {
      return false; // Globally disabled
    }

    if (flag.rolloutPercentage >= 100) {
      return true; // Fully enabled
    }

    if (flag.rolloutPercentage <= 0) {
      return false; // Fully disabled
    }

    const bucket = hashUserToBucket(userId);
    return bucket < flag.rolloutPercentage;
  }  

  async getFlagsForClient(environment: string) {
    return this.prisma.featureFlag.findMany({
      where: {
        environment,
        enabled: true, // or include disabled if SDK wants full context
      },
      select: {
        id: true,
        name: true,
        enabled: true,
        rolloutPercentage: true,
        // any other relevant fields
      },
    });
  }

  private evaluateAdvancedRules(params: {
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

  async getFlags(query: {
    environment?: string;
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    userId: string;
  }) {
    const {
      environment,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      userId,
    } = query;

    const whereClause = {
      ...(environment ? { environment } : {}),
      createdById: userId,
    };

    const [flags, totalCount] = await Promise.all([
      this.prisma.featureFlag.findMany({
        where: whereClause,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      this.prisma.featureFlag.count({
        where: whereClause,
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
    rolloutPercentage?: number;
  }, userId: string) {
    const newFlag = await this.prisma.featureFlag.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        environment: data.environment,
        createdById: userId,
        updatedById: userId,
        rolloutPercentage: data.rolloutPercentage ?? 0,
      },
    });
    await this.auditLogService.logAuditAction('CREATE', newFlag.id, newFlag.name, userId, {
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
    userId: string,
  ) {
    const updatedFlag = await this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...data,
        version: { increment: 1 },
        updatedById: userId,
      },
    });
    await this.auditLogService.logAuditAction(
      'UPDATE',
      updatedFlag.id,
      updatedFlag.name,
      userId,
      {
        ...updatedFlag,
      },
    );
    return updatedFlag;
  }

  async deleteFlag(id: string, userId: string) {
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

      await this.auditLogService.logAuditAction('DELETE', flag.id, flag.name, userId, {
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

    const isEnabled = await this.isFlagEnabledForUser(flag.id, userId);

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
    const forceEnable = this.evaluateAdvancedRules(userAttributes);

    const isEnabled =
      forceEnable || (await this.isFlagEnabledForUser(flag.id, userId));

    return {
      flagName: flag.name,
      isEnabled,
      rollout: flag.rolloutPercentage,
      evaluatedAt: new Date().toISOString(),
      appliedAdvancedRules: forceEnable,
    };
  }

  async getAuditLogs(flagId?: string) {
    return this.auditLogService.getAuditLogs({ flagId });
  }
}
