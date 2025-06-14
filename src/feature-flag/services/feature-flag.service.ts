import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { hashUserToBucket } from '../../utils/hash';
import { AuditLogService } from '../../audit-logs/services/audit-logs.service';
import { BasePrismaService } from '../../common/services/base-prisma.service';
import { FeatureFlag } from '@prisma/client';

@Injectable()
export class FeatureFlagService extends BasePrismaService {
  constructor(
    prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {
    super(prisma);
  }

  private async isFlagEnabledForUser(
    flagId: string,
    userId: string,
  ): Promise<boolean> {
    const flag = await this.findUnique<FeatureFlag>('featureFlag', {
      where: { id: flagId },
    });

    if (!flag) {
      throw new NotFoundException('Feature flag not found');
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

  async getFlagsForClient(environment: string, apiKey: string) {
    const prefix = apiKey.slice(0, 8);
    const keyRecord = await this.prisma.apiKey.findFirst({
      where: { prefix, isActive: true },
      select: { hashedKey: true, owner: true },
    });
    if (!keyRecord) {
      return [];
    }
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(apiKey, keyRecord.hashedKey);
    if (!isValid) {
      return [];
    }
    const userId = keyRecord.owner;
    if (!userId) {
      return [];
    }
    // Now fetch flags for this user
    const normalizedEnv = environment.toLowerCase();
    const flags = await this.findMany<FeatureFlag>('featureFlag', {
      where: {
        environment: normalizedEnv,
        enabled: true,
        createdById: userId,
      },
      select: {
        id: true,
        name: true,
        enabled: true,
        rolloutPercentage: true,
      },
    });
    return flags;
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
      this.findMany<FeatureFlag>('featureFlag', {
        where: whereClause,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sort]: order },
      }),
      this.count('featureFlag', {
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

  async createFlag(
    data: {
      name: string;
      description?: string;
      enabled?: boolean;
      environment: string;
      rolloutPercentage?: number;
    },
    userId: string,
  ) {
    const normalizedEnv = data.environment.toLowerCase();
    const newFlag = await this.create<FeatureFlag>('featureFlag', {
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        environment: normalizedEnv,
        createdById: userId,
        updatedById: userId,
        rolloutPercentage: data.rolloutPercentage ?? 0,
      },
    });
    await this.auditLogService.logAuditAction(
      'CREATE',
      newFlag.id,
      newFlag.name,
      userId,
      {
        ...newFlag,
      },
    );
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
    const updatedFlag = await this.update<FeatureFlag>('featureFlag', {
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
      const flag = await this.findUnique<FeatureFlag>('featureFlag', {
        where: { id },
      });

      if (!flag) {
        throw new NotFoundException(`Feature flag with ID ${id} not found.`);
      }

      const deletedFlag = await this.delete<FeatureFlag>('featureFlag', {
        where: { id },
      });

      await this.auditLogService.logAuditAction(
        'DELETE',
        flag.id,
        flag.name,
        userId,
        {
          ...flag,
        },
      );

      return deletedFlag;
    } catch (error) {
      console.error('Error deleting flag:', error);
      throw error;
    }
  }

  async evaluateFlag(flagName: string, userId: string, environment: string) {
    const flag = await this.findFirst<FeatureFlag>('featureFlag', {
      where: {
        name: flagName,
        environment,
      },
    });

    if (!flag) {
      throw new NotFoundException(
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
    const flag = await this.findFirst<FeatureFlag>('featureFlag', {
      where: {
        name: flagName,
        environment,
      },
    });

    if (!flag) {
      throw new NotFoundException(
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
