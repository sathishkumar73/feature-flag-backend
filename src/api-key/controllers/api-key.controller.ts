import { Controller, Post, Body, Put, Get } from '@nestjs/common';
import { ApiKeyService } from '../services/api-key.service';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  async getApiKey(@Body() body: { orgName?: string; owner?: string }) {
    const apiKey = await this.apiKeyService.getActiveApiKey(body.orgName, body.owner);
    return { apiKey };
  }

  // Generate new key, revoke old if exists
  @Post('generate')
  async generateApiKey(@Body() body: { orgName?: string; owner?: string }) {
    // Revoke existing
    const activeKey = await this.apiKeyService.getActiveApiKey(body.orgName, body.owner);
    if (activeKey) {
      await this.apiKeyService.revokeApiKey(activeKey.id);
    }

    // Create new
    const { apiKeyPlain } = await this.apiKeyService.generateAndStoreApiKey(body.orgName, body.owner);
    return { apiKey: apiKeyPlain };
  }

  // Revoke active key explicitly
  @Put('revoke')
  async revokeApiKey(@Body() body: { id: number }) {
    return this.apiKeyService.revokeApiKey(body.id);
  }
}
