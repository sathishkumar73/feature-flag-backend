import { PrismaService } from 'src/prisma/prisma.service';

export abstract class BasePrismaService {
  constructor(protected readonly prisma: PrismaService) {}

  protected async findMany<T>(model: keyof PrismaService, args: any): Promise<T[]> {
    // @ts-ignore
    return this.prisma[model].findMany(args);
  }

  protected async findFirst<T>(model: keyof PrismaService, args: any): Promise<T | null> {
    // @ts-ignore
    return this.prisma[model].findFirst(args);
  }

  protected async findUnique<T>(model: keyof PrismaService, args: any): Promise<T | null> {
    // @ts-ignore
    return this.prisma[model].findUnique(args);
  }

  protected async create<T>(model: keyof PrismaService, args: any): Promise<T> {
    // @ts-ignore
    return this.prisma[model].create(args);
  }

  protected async update<T>(model: keyof PrismaService, args: any): Promise<T> {
    // @ts-ignore
    return this.prisma[model].update(args);
  }

  protected async delete<T>(model: keyof PrismaService, args: any): Promise<T> {
    // @ts-ignore
    return this.prisma[model].delete(args);
  }

  protected async count(model: keyof PrismaService, args: any): Promise<number> {
    // @ts-ignore
    return this.prisma[model].count(args);
  }
}
