import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BasePrismaService } from '../../common/services/base-prisma.service';
import { PlaygroundFeatureFlag } from '@prisma/client';

@Injectable()
export class PlaygroundService extends BasePrismaService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // Upsert a playground flag scoped by sessionId and flagKey
  async upsertFlag(
    sessionId: string,
    data: { flagKey: string; enabled: boolean; rollout_percentage: number },
  ): Promise<PlaygroundFeatureFlag> {
    const { flagKey, enabled, rollout_percentage } = data;
    return this.prisma.playgroundFeatureFlag.upsert({
      where: {
        session_id_flag_key: {
          session_id: sessionId,
          flag_key: flagKey,
        },
      },
      update: {
        enabled,
        rollout_percentage,
        updatedAt: new Date(),
      },
      create: {
        session_id: sessionId,
        flag_key: flagKey,
        enabled,
        rollout_percentage,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  // Fetch a specific playground flag by sessionId and flagKey
  async getFlag(
    sessionId: string,
    flagKey: string,
  ): Promise<Pick<
    PlaygroundFeatureFlag,
    'flag_key' | 'enabled' | 'rollout_percentage'
  > | null> {
    return this.findUnique<
      Pick<PlaygroundFeatureFlag, 'flag_key' | 'enabled' | 'rollout_percentage'>
    >('playgroundFeatureFlag', {
      where: {
        session_id_flag_key: {
          session_id: sessionId,
          flag_key: flagKey,
        },
      },
      select: {
        flag_key: true,
        enabled: true,
        rollout_percentage: true,
      },
    });
  }

  async getFlagsForSession(sessionId: string) {
    return this.prisma.playgroundFeatureFlag.findMany({
      where: { session_id: sessionId },
      select: {
        flag_key: true,
        enabled: true,
        rollout_percentage: true,
      },
    });
  }
}
