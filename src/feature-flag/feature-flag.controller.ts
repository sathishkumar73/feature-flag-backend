import { Body, Controller, Get, Post } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { CreateFeatureFlagDto } from './create-feature-flag.dto';

@Controller('flags')
export class FeatureFlagController {
  constructor(private featureFlagService: FeatureFlagService) {}

  @Get()
  async getFlags() {
    return this.featureFlagService.getAllFlags();
  }

  @Post()
  async createFlag(@Body() body: CreateFeatureFlagDto) {
    return this.featureFlagService.createFlag(body);
  }
}