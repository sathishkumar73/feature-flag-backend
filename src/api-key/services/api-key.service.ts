// src/api-key/api-key.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async generateAndStoreApiKey(
    orgName?: string,
    owner?: string,
  ): Promise<{ apiKeyPlain: string }> {
    const apiKeyPlain = randomBytes(32).toString('hex');
    const hashedKey = await bcrypt.hash(apiKeyPlain, 10);

    await this.prisma.apiKey.create({
      data: {
        hashedKey,
        orgName,
        owner,
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

  async getActiveApiKey(orgName?: string, owner?: string) {
    return this.prisma.apiKey.findFirst({
      where: {
        isActive: true,
        orgName,
        owner,
      },
      select: {
        id: true,
        orgName: true,
        owner: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrCreateApiKey(
    orgName?: string,
    owner?: string,
  ): Promise<{ apiKeyPlain: string | null; apiKeyMeta: any }> {
    const existingKey = await this.getActiveApiKey(orgName, owner);

    if (existingKey) {
      // Return metadata only, no plain key for security
      return { apiKeyPlain: null, apiKeyMeta: existingKey };
    }

    // No active key found, create new
    const { apiKeyPlain } = await this.generateAndStoreApiKey(orgName, owner);

    const newKeyMeta = await this.getActiveApiKey(orgName, owner);

    return { apiKeyPlain, apiKeyMeta: newKeyMeta };
  }
}
