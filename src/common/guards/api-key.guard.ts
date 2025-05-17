import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyHeader = request.headers['x-api-key'];

    const validApiKey = this.configService.get<string>('API_KEY');

    if (!apiKeyHeader || apiKeyHeader !== validApiKey) {
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
