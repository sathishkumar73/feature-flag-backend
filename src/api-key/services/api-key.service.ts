// src/api-key/api-key.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  async generateAndStoreApiKey(orgName?: string, owner?: string): Promise<{ apiKeyPlain: string }> {
    // Generate secure random API key (hex string, 64 chars = 256 bits)
    const apiKeyPlain = randomBytes(32).toString('hex');

    // Hash the api key with bcrypt
    const hashedKey = await bcrypt.hash(apiKeyPlain, 10);

    // Store hashed key in DB with optional metadata
    await this.prisma.apiKey.create({
      data: {
        hashedKey,
        orgName,
        owner,
      },
    });

    // Return plain API key so it can be delivered to client/admin securely
    return { apiKeyPlain };
  }

  async revokeApiKey(id: number) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
  }
  
  // Fetch the current active API key metadata (without returning the hashed key)
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
}
