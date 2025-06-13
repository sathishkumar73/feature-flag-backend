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
import { JwtOrApiKeyGuard } from 'src/common/guards/jwt-or-apikey.guard';
import {
  ApiTags,
  ApiSecurity,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

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
  async getApiKey(@Request() req) {
    const { apiKeyPlain, apiKeyMeta } =
      await this.apiKeyService.getOrCreateApiKey(req.user.sub);
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
  async generateApiKey(@Request() req) {
    const activeKey = await this.apiKeyService.getActiveApiKey(req.user.sub);
    if (activeKey) {
      await this.apiKeyService.revokeApiKey(activeKey.id);
    }

    const { apiKeyPlain } = await this.apiKeyService.generateAndStoreApiKey(req.user.sub);
    return { apiKey: apiKeyPlain };
  }

  @Put('revoke')
  @ApiOperation({ summary: 'Revoke an active API key explicitly' })
  @ApiResponse({ status: 200, description: 'API key revoked successfully' })
  @ApiBadRequestResponse({ description: 'Invalid key id' })
  async revokeApiKey(@Body() body: { id: number }) {
    if (!body.id) {
      throw new BadRequestException('API key id is required');
    }
    return this.apiKeyService.revokeApiKey(body.id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate an API key' })
  @ApiResponse({ status: 200, description: 'API key is valid' })
  @ApiBadRequestResponse({ description: 'Invalid or missing API key' })
  async validateApiKey(@Body() body: { apiKey: string }) {
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
