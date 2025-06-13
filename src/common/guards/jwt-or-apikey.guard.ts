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
    console.log('JwtOrApiKeyGuard constructed, apiKeyService:', !!apiKeyService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    console.log('JwtOrApiKeyGuard canActivate called');
    // First try JWT validation
    try {
      const canActivateJwt = (await super.canActivate(context)) as boolean;
      if (canActivateJwt) {
        console.log('JwtOrApiKeyGuard: JWT valid');
        return true;
      }
    } catch (err) {
      console.log('JwtOrApiKeyGuard: JWT validation failed, trying API key', err);
    }

    // Fallback to API key validation
    const apiKey = request.headers['x-api-key'];
    console.log('JwtOrApiKeyGuard: API key from header:', apiKey);
    if (!apiKey || typeof apiKey !== 'string') {
      console.log('JwtOrApiKeyGuard: No valid API key provided');
      throw new UnauthorizedException('No valid JWT token or API key provided');
    }

    if (!this.apiKeyService) {
      console.log('JwtOrApiKeyGuard: apiKeyService is undefined!');
      throw new UnauthorizedException('Internal error: apiKeyService not available');
    }

    const isValidApiKey = await this.apiKeyService.validateApiKey(apiKey);
    console.log('JwtOrApiKeyGuard: API key valid?', isValidApiKey);
    if (!isValidApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    // If valid, allow access and attach relevant user info to request
    request.user = { apiKey, scope: 'sdk' };
    return true;
  }
}
