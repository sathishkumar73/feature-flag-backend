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

    return this.prisma.featureFlag.findMany({
      where: environment ? { environment } : {},
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [sort]: order },
    });
  }

  createFlag(data: {
    name: string;
    description?: string;
    enabled?: boolean;
    environment: string;
  }) {
    return this.prisma.featureFlag.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        environment: data.environment,
      },
    });
  }

  updateFlag(
    id: string,
    data: {
      name?: string;
      description?: string;
      enabled?: boolean;
      environment?: string;
    },
  ) {
    return this.prisma.featureFlag.update({
      where: { id },
      data,
    });
  }

  async deleteFlag(id: string) {
    try {
      return await this.prisma.featureFlag.delete({
        where: { id },
      });
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
}
