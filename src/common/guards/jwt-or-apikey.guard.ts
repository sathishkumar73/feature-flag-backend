import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiKeyService } from '../../api-key/services/api-key.service';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard('jwt') {
  constructor(private readonly apiKeyService: ApiKeyService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // First try JWT validation
    try {
      const canActivateJwt = (await super.canActivate(context)) as boolean;
      if (canActivateJwt) {
        return true;
      }
    } catch (err) {
      // JWT validation failed, will try API key validation
    }

    // Fallback to API key validation
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('No valid JWT token or API key provided');
    }

    // TODO: Validate API key (e.g., check against DB or cache)
    const isValidApiKey = await this.validateApiKey(apiKey);
    if (!isValidApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // If valid, allow access and attach relevant user info to request
    request.user = { apiKey, scope: 'sdk' };
    return true;
  }

  // Dummy async API key validator (replace with actual logic)
  private async validateApiKey(apiKey: string): Promise<boolean> {
    // Query your service to check if API key exists and is active
    const keyRecord = await this.apiKeyService.getActiveApiKey();
    return !!keyRecord;
  }
  
}
