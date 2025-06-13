import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface PlaygroundJwtPayload {
  scope: string;
  sessionId: string;
  permissions?: string[];
  [key: string]: unknown;
}

@Injectable()
export class PlaygroundJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: PlaygroundJwtPayload }>();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }

    const token: string = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify<PlaygroundJwtPayload>(token);

      if (
        payload.scope !== 'playground' ||
        !payload.sessionId ||
        !Array.isArray(payload.permissions) ||
        !payload.permissions.includes('write') // adjust permission as needed
      ) {
        throw new UnauthorizedException(
          'Invalid token scope, sessionId, or permissions',
        );
      }

      // Attach payload to request.user for downstream usage if needed
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
