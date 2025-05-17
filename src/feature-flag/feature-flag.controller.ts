import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { CreateFeatureFlagDto } from './create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './update-feature-flag.dto';

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

  @Put(':id')
  async updateFlag(
    @Param('id') id: string,
    @Body() body: UpdateFeatureFlagDto,
  ) {
    return this.featureFlagService.updateFlag(id, body);
  }

  @Delete(':id')
  async deleteFlag(@Param('id') id: string) {
    return this.featureFlagService.deleteFlag(id);
  }
}
