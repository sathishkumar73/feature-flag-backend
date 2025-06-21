import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { MarketingService } from '../services/marketing.service';
import { CreateOutreachRecordDto } from '../dtos/create-outreach-record.dto';
import { UpdateOutreachRecordDto } from '../dtos/update-outreach-record.dto';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('dashboard')
  getDashboardData() {
    return this.marketingService.getOutReachData();
  }
  
  @Get('outreach')
  getOutreachRecords() {
    return this.marketingService.getOutreachRecords();
  }
  
  @Get('outreach/:id')
  getOutreachRecordById(@Param('id') id: string) {
    return this.marketingService.getOutreachRecordById(id);
  }
  
  @UseGuards(JwtOrApiKeyGuard)
  @Delete('outreach/:id')
  deleteOutreachRecord(@Param('id') id: string) {
    return this.marketingService.deleteOutreachRecord(id);
  }

  @UseGuards(JwtOrApiKeyGuard)
  @Post('outreach')
  createOutreachRecord(@Body() createOutreachRecordDto: CreateOutreachRecordDto) {
    return this.marketingService.createOutreachRecord(createOutreachRecordDto);
  }

  @UseGuards(JwtOrApiKeyGuard)
  @Put('outreach/:id')
  updateOutreachRecord(
    @Param('id') id: string,
    @Body() updateOutreachRecordDto: UpdateOutreachRecordDto
  ) {
    return this.marketingService.updateOutreachRecord(id, updateOutreachRecordDto);
  }
}
