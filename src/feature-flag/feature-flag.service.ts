import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  constructor(private prisma: PrismaService) {}

  getAllFlags() {
    return this.prisma.featureFlag.findMany();
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
}
