import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CreateFeatureFlagDto } from '../dtos/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dtos/update-feature-flag.dto';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('flags')
export class FeatureFlagController {
  constructor(private featureFlagService: FeatureFlagService) {}

  @Get()
  async getFlags(
    @Query('environment') environment?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('sort') sort: string = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    return this.featureFlagService.getFlags({
      environment,
      page: isNaN(pageNum) ? 1 : pageNum,
      limit: isNaN(limitNum) ? 10 : limitNum,
      sort,
      order,
    });
  }

  @Get('evaluate')
  async evaluateFlag(
    @Query('flagName') flagName: string,
    @Query('userId') userId: string,
    @Query('environment') environment = 'production',
  ) {
    if (!flagName || !userId) {
      throw new BadRequestException('flagName and userId are required.');
    }
    return this.featureFlagService.evaluateFlag(flagName, userId, environment);
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
