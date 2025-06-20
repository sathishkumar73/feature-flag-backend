import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateInviteToken } from '../utils/jwt';

@Injectable()
export class WaitListSignupService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureRootUser(email: string) {
    const isRoot = await this.prisma.root_users.findUnique({ where: { email } });
    if (!isRoot) throw new ForbiddenException('Not authorized');
  }

  async updateWaitListStatus(email: string, status: 'APPROVED' | 'PENDING' | 'REVOKED') {
    // Update wait_list_signup status
    const updated = await this.prisma.wait_list_signup.update({
      where: { email },
      data: { status },
    });
    if (!updated) throw new NotFoundException('Waitlist user not found');

    if (status === 'APPROVED') {
      // Generate invite token
      const invite_token = generateInviteToken();
      // Upsert beta_users entry with invite_token
      await this.prisma.beta_users.upsert({
        where: { email },
        update: { invite_token },
        create: { email, invite_token },
      });
      // Optionally: return or send invite_token to frontend/email
      return { ...updated, invite_token };
    } else if (status === 'REVOKED') {
      // Remove from beta_users
      await this.prisma.beta_users.deleteMany({ where: { email } });
    } else if (status === 'PENDING') {
      // Upsert beta_users entry (if needed, no invite_token)
      await this.prisma.beta_users.upsert({
        where: { email },
        update: {},
        create: { email },
      });
    }
    return updated;
  }

  async getWaitListForRootUser(email: string) {
    await this.ensureRootUser(email);
    return this.prisma.wait_list_signup.findMany();
  }

  async verifyBetaUserInviteToken(email: string, token: string): Promise<boolean> {
    const betaUser = await this.prisma.beta_users.findUnique({ where: { email } });
    return !!(betaUser && betaUser.invite_token === token);
  }

  async verifyBetaUserInviteTokenByToken(token: string): Promise<string | null> {
    const betaUser = await this.prisma.beta_users.findFirst({ where: { invite_token: token } });
    return betaUser ? betaUser.email : null;
  }
}
