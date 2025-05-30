import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlaygroundService {
  constructor(private readonly prisma: PrismaService) {}

  // Upsert a playground flag scoped by sessionId and flagKey
  async upsertFlag(
    sessionId: string,
    data: { flagKey: string; enabled: boolean; rollout_percentage: number }
  ) {
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
  async getFlag(sessionId: string, flagKey: string) {
    const flag = await this.prisma.playgroundFeatureFlag.findUnique({
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

    if (!flag) {
      throw new NotFoundException(
        `Playground flag '${flagKey}' for session '${sessionId}' not found.`,
      );
    }

    return flag;
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
