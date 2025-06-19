import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WaitListSignupService {
  constructor(private readonly prisma: PrismaService) {}

  async getWaitListForRootUser(email: string) {
    console.log(`Checking wait list for root user: ${email}`);
    const isRoot = await this.prisma.root_users.findUnique({ where: { email } });
    if (!isRoot) throw new ForbiddenException('Not authorized');
    return this.prisma.wait_list_signup.findMany();
  }
}
