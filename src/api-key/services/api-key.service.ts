// src/api-key/api-key.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async generateAndStoreApiKey(
    userId: string,
  ): Promise<{ apiKeyPlain: string }> {
    const apiKeyPlain = randomBytes(32).toString('hex');
    const prefix = apiKeyPlain.slice(0, 8); // Use first 8 chars as prefix
    const hashedKey = await bcrypt.hash(apiKeyPlain, 10);

    await this.prisma.apiKey.create({
      data: {
        prefix,
        hashedKey,
        owner: userId,
        createdById: userId,
      },
    });

    return { apiKeyPlain };
  }

  async revokeApiKey(id: number) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }

  async getActiveApiKey(userId: string) {
    return this.prisma.apiKey.findFirst({
      where: {
        isActive: true,
        owner: userId,
      },
      select: {
        id: true,
        owner: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrCreateApiKey(
    userId: string,
  ): Promise<{ apiKeyPlain: string | null; apiKeyMeta: any }> {
    const existingKey = await this.getActiveApiKey(userId);

    if (existingKey) {
      // Return metadata only, no plain key for security
      return { apiKeyPlain: null, apiKeyMeta: existingKey };
    }

    // No active key found, create new
    const { apiKeyPlain } = await this.generateAndStoreApiKey(userId);

    const newKeyMeta = await this.getActiveApiKey(userId);

    return { apiKeyPlain, apiKeyMeta: newKeyMeta };
  }
}
