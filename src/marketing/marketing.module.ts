import { Module } from '@nestjs/common';
import { MarketingService } from './services/marketing.service';
import { MarketingController } from './controllers/marketing.controller';

@Module({
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
