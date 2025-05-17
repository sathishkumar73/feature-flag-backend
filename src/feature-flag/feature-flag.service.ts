import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  getAllFlags() {
    return this.prisma.featureFlag.findMany();
  }

  createFlag(data: { name: string; description?: string; enabled?: boolean; environment: string }) {
    return this.prisma.featureFlag.create({
      data: {
        name: data.name,
        description: data.description,
        enabled: data.enabled ?? false,
        environment: data.environment,
      },
    });
  }
}
