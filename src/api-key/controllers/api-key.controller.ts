// src/api-key/api-key.controller.ts
import {
  Controller,
  Post,
  Body,
  Put,
  Get,
  UseGuards,
  BadRequestException,
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
    summary: 'Get or create active API key for the organization and owner',
  })
  @ApiResponse({
    status: 200,
    description: 'API key metadata and optionally plain key on first fetch',
  })
  async getApiKey(@Body() body: { orgName?: string; owner?: string }) {
    const { apiKeyPlain, apiKeyMeta } =
      await this.apiKeyService.getOrCreateApiKey(body.orgName, body.owner);
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
  async generateApiKey(@Body() body: { orgName?: string; owner?: string }) {
    const activeKey = await this.apiKeyService.getActiveApiKey(
      body.orgName,
      body.owner,
    );
    if (activeKey) {
      await this.apiKeyService.revokeApiKey(activeKey.id);
    }

    const { apiKeyPlain } = await this.apiKeyService.generateAndStoreApiKey(
      body.orgName,
      body.owner,
    );
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
}
