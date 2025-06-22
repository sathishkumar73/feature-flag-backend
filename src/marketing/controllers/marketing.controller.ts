import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { MarketingService } from '../services/marketing.service';
import { CreateOutreachRecordDto } from '../dtos/create-outreach-record.dto';
import { UpdateOutreachRecordDto } from '../dtos/update-outreach-record.dto';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('outreach')
  getDashboardData() {
    return this.marketingService.getOutReachData();
  }

  @UseGuards(JwtOrApiKeyGuard)
  @Post('outreach')
  createOutreachRecord(@Body() createOutreachRecordDto: CreateOutreachRecordDto) {
    return this.marketingService.createOutreachRecord(createOutreachRecordDto);
  }

  @UseGuards(JwtOrApiKeyGuard)
  @Put('outreach')
  updateOutreachRecord(@Body() updateOutreachRecordDto: UpdateOutreachRecordDto) {
    return this.marketingService.updateOutreachRecord(updateOutreachRecordDto);
  }
}
