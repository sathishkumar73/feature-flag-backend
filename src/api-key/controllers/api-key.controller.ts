// src/api-key/api-key.controller.ts
import {
  Controller,
  Post,
  Body,
  Put,
  Get,
  UseGuards,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';
import { JwtOrApiKeyGuard } from '../../common/guards/jwt-or-apikey.guard';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { RevokeApiKeyDto } from '../dtos/revoke-api-key.dto';
import { ValidateApiKeyDto } from '../dtos/validate-api-key.dto';
import { RequestWithUser } from '../../auth/types/request-with-user.type';
import { ApiKey } from '@prisma/client';

@ApiTags('API Keys')
@ApiSecurity('X-API-KEY')
@Controller('api-keys')
@UseGuards(JwtOrApiKeyGuard)
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get or create active API key for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'API key metadata and optionally plain key on first fetch',
  })
  async getApiKey(@Request() req: RequestWithUser) {
    const {
      apiKeyPlain,
      apiKeyMeta,
    }: {
      apiKeyPlain: string | null;
      apiKeyMeta: Pick<
        ApiKey,
        'id' | 'owner' | 'createdAt' | 'updatedAt'
      > | null;
    } = await this.apiKeyService.getOrCreateApiKey(req.user.sub);
    console.log(apiKeyMeta, apiKeyPlain);
    return { apiKey: apiKeyMeta, plainKey: apiKeyPlain };
  }

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a new API key and revoke the old one if it exists',
  })
  @ApiResponse({
    status: 201,
    description: 'New API key generated and returned',
  })
  async generateApiKey(@Request() req: RequestWithUser) {
    const activeKey = await this.apiKeyService.getActiveApiKey(req.user.sub);
    if (activeKey) {
      await this.apiKeyService.revokeApiKey(activeKey.id);
    }

    const { apiKeyPlain } = await this.apiKeyService.generateAndStoreApiKey(
      req.user.sub,
    );
    return { apiKey: apiKeyPlain };
  }

  @Put('revoke')
  @ApiOperation({ summary: 'Revoke an active API key explicitly' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiBadRequestResponse({ description: 'Invalid key id' })
  async revokeApiKey(@Body() body: RevokeApiKeyDto) {
    if (!body.id) {
      throw new BadRequestException('API key id is required');
    }
    return this.apiKeyService.revokeApiKey(body.id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an API key' })
  @ApiResponse({ status: 200, description: 'API key is valid' })
  @ApiBadRequestResponse({ description: 'Invalid or missing API key' })
  async validateApiKey(@Body() body: ValidateApiKeyDto) {
    if (!body.apiKey) {
      throw new BadRequestException('API key is required');
    }
    const isValid = await this.apiKeyService.validateApiKey(body.apiKey);
    if (!isValid) {
      throw new BadRequestException('Invalid API key');
    }
    return { valid: true };
  }
}
