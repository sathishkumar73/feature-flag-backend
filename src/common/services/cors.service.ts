import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BasePrismaService } from './base-prisma.service';

@Injectable()
export class CorsService extends BasePrismaService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  // Fetch all allowed origins (project URLs) from the database
  async getAllowedOrigins(): Promise<string[]> {
    const origins = await this.findMany<{ origin: string }>('allowedOrigin', {
      select: { origin: true },
    });
    return origins.map((o) => o.origin);
  }
}
