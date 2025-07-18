// src/api-key/api-key.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { BasePrismaService } from '../../common/services/base-prisma.service';
import { ApiKey } from '@prisma/client';

@Injectable()
export class ApiKeyService extends BasePrismaService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async generateAndStoreApiKey(
    userId: string,
  ): Promise<{ apiKeyPlain: string }> {
    const apiKeyPlain = randomBytes(32).toString('hex');
    const prefix = apiKeyPlain.slice(0, 8); // Use first 8 chars as prefix
    const hashedKey = await bcrypt.hash(apiKeyPlain, 10);

    await this.create<ApiKey>('apiKey', {
      data: {
        prefix,
        hashedKey,
        owner: userId,
        createdById: userId,
      },
    });

    return { apiKeyPlain };
  }

  async revokeApiKey(id: string): Promise<ApiKey> {
    return this.update<ApiKey>('apiKey', {
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async getActiveApiKey(
    userId: string,
  ): Promise<Pick<ApiKey, 'id' | 'owner' | 'createdAt' | 'updatedAt' | 'hashedKey'> | null> {
    try {
      const result = await this.findFirst<
        Pick<ApiKey, 'id' | 'owner' | 'createdAt' | 'updatedAt' | 'hashedKey'>
      >('apiKey', {
        where: {
          isActive: true,
          owner: userId,
        },
        select: {
          id: true,
          owner: true,
          createdAt: true,
          updatedAt: true,
          hashedKey: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return result;
    } catch (err) {
      throw err;
    }
  }

  async getOrCreateApiKey(userId: string): Promise<{
    apiKeyPlain: string | null;
    apiKeyMeta: Pick<ApiKey, 'id' | 'owner' | 'createdAt' | 'updatedAt' | 'hashedKey'> | null;
  }> {
    console.log('[ApiKeyService][getOrCreateApiKey] userId:', userId);
    const existingKey = await this.getActiveApiKey(userId);
    console.log('[ApiKeyService][getOrCreateApiKey] existingKey:', existingKey);

    if (existingKey) {
      return { apiKeyPlain: null, apiKeyMeta: existingKey };
    }

    // Check if user has any API key history (active or revoked)
    try {
      const keyHistory = await this.prisma.apiKey.findFirst({
        where: { owner: userId },
        select: { id: true },
      });

      if (keyHistory) {
        return { apiKeyPlain: null, apiKeyMeta: null };
      }
    } catch (err) {
      throw err;
    }

    // No history at all, create new
    const { apiKeyPlain } = await this.generateAndStoreApiKey(userId);
    const newKeyMeta = await this.getActiveApiKey(userId);
    return { apiKeyPlain, apiKeyMeta: newKeyMeta };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const prefix = apiKey.slice(0, 8); // Extract prefix from provided key
      const keyRecord = await this.prisma.apiKey.findFirst({
        where: { prefix, isActive: true },
        select: { hashedKey: true },
      });
      if (!keyRecord) return false;
      return await bcrypt.compare(apiKey, keyRecord.hashedKey);
    } catch (error) {
      return false;
    }
  }

  async getApiKeyHistory(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { owner: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefix: true,
        hashedKey: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastUsedAt: true,
        expiresAt: true,
        description: true,
      },
    });
  }
}
