import { Module } from '@nestjs/common';
import { WaitListSignupController } from './wait-list-signup.controller';
import { WaitListSignupService } from './wait-list-signup.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [WaitListSignupController],
  providers: [WaitListSignupService, PrismaService],
})
export class WaitListSignupModule {}
