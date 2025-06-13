import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CorsService {
  constructor(private prisma: PrismaService) {}

  // Fetch all allowed origins (project URLs) from the database
  async getAllowedOrigins(): Promise<string[]> {
    const origins = await this.prisma.allowedOrigin.findMany({
      select: { origin: true },
    });
    return origins.map((o) => o.origin);
  }
}
