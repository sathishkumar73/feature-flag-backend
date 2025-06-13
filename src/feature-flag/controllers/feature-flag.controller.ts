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
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FeatureFlagService } from '../services/feature-flag.service';
import { CreateFeatureFlagDto } from '../dtos/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from '../dtos/update-feature-flag.dto';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import { RequestWithUser } from '../../auth/types/request-with-user.type';

@ApiTags('Flags')
@ApiSecurity('X-API-KEY')
@Controller('flags')
@UseGuards(JwtOrApiKeyGuard)
export class FeatureFlagController {
  constructor(private featureFlagService: FeatureFlagService) {}

  @ApiOperation({ summary: 'Get flags for client environment' })
  @ApiQuery({ name: 'environment', required: true, example: 'production' })
  @ApiResponse({
    status: 200,
    description: 'Returns flags for the given environment',
  })
  @Get('client-flags')
  async getFlagsForClient(@Query('environment') environment: string) {
    return this.featureFlagService.getFlagsForClient(environment);
  }

  @ApiOperation({ summary: 'Get paginated list of flags' })
  @ApiQuery({ name: 'environment', required: false, example: 'staging' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({ name: 'sort', required: false, example: 'createdAt' })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @ApiResponse({ status: 200, description: 'Returns paginated flags' })
  @Get()
  async getFlags(
    @Req() req: RequestWithUser,
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
      userId: req.user.sub,
    });
  }

  @ApiOperation({ summary: 'Evaluate feature flag for a user' })
  @ApiQuery({ name: 'flagName', required: true, example: 'new-ui' })
  @ApiQuery({ name: 'userId', required: true, example: 'user-123' })
  @ApiQuery({ name: 'environment', required: false, example: 'production' })
  @ApiResponse({
    status: 200,
    description: 'Returns the evaluation result for the flag',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required query parameters',
  })
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

  @ApiOperation({ summary: 'Evaluate feature flag with advanced criteria' })
  @ApiQuery({ name: 'flagName', required: true, example: 'beta-feature' })
  @ApiQuery({ name: 'userId', required: true, example: 'user-456' })
  @ApiQuery({ name: 'region', required: false, example: 'us-west' })
  @ApiQuery({ name: 'planType', required: false, example: 'pro' })
  @ApiQuery({ name: 'userGroup', required: false, example: 'beta-testers' })
  @ApiQuery({ name: 'environment', required: false, example: 'production' })
  @ApiResponse({
    status: 200,
    description: 'Returns evaluation result with advanced criteria',
  })
  @ApiResponse({
    status: 400,
    description: 'Missing required query parameters',
  })
  @Get('evaluate-advanced')
  async evaluateAdvancedFlag(
    @Query('flagName') flagName: string,
    @Query('userId') userId: string,
    @Query('region') region?: string,
    @Query('planType') planType?: string,
    @Query('userGroup') userGroup?: string,
    @Query('environment') environment = 'production',
  ) {
    if (!flagName || !userId) {
      throw new BadRequestException('flagName and userId are required.');
    }
    return this.featureFlagService.evaluateAdvancedFlag(
      flagName,
      userId,
      environment,
      { region, planType, userGroup },
    );
  }

  @ApiOperation({ summary: 'Get audit logs for a flag (optional flagId)' })
  @ApiQuery({ name: 'flagId', required: false, example: '123' })
  @ApiResponse({ status: 200, description: 'Returns audit logs' })
  @Get('audit-logs')
  async getAuditLogs(@Query('flagId') flagId?: string) {
    return this.featureFlagService.getAuditLogs(flagId);
  }

  @ApiOperation({ summary: 'Create a new feature flag' })
  @ApiResponse({ status: 201, description: 'Feature flag created' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFlag(
    @Body() body: CreateFeatureFlagDto,
    @Req() req: RequestWithUser,
  ) {
    return this.featureFlagService.createFlag(body, req.user.sub);
  }

  @ApiOperation({ summary: 'Update an existing feature flag by ID' })
  @ApiResponse({ status: 200, description: 'Feature flag updated' })
  @Put(':id')
  async updateFlag(
    @Param('id') id: string,
    @Body() body: UpdateFeatureFlagDto,
    @Req() req: RequestWithUser,
  ) {
    return this.featureFlagService.updateFlag(id, body, req.user.sub);
  }

  @ApiOperation({ summary: 'Delete a feature flag by ID' })
  @ApiResponse({ status: 204, description: 'Feature flag deleted' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteFlag(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.featureFlagService.deleteFlag(id, req.user.sub);
  }
}
