import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
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
      // Ignore JWT errors and fall back to API key
    }

    // Fallback to API key validation
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('No valid JWT token or API key provided');
    }

    if (!this.apiKeyService) {
      throw new UnauthorizedException('Internal error: apiKeyService not available');
    }

    const isValidApiKey = await this.apiKeyService.validateApiKey(apiKey);
    if (!isValidApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // If valid, allow access and attach relevant user info to request
    request.user = { apiKey, scope: 'sdk' };
    return true;
  }
}
