import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';

@Injectable()
export class PlaygroundLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Playground');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const sessionId = req.params?.sessionId || 'unknown-session';
    const startTime = Date.now();

    this.logger.log(
      `Incoming request: ${method} ${url} (session: ${sessionId})`,
    );

    return next.handle().pipe(
      tap(() => {
        const elapsed = Date.now() - startTime;
        this.logger.log(
          `Completed ${method} ${url} (session: ${sessionId}) in ${elapsed}ms`,
        );
      }),
      catchError((err) => {
        const elapsed = Date.now() - startTime;
        this.logger.error(
          `Error in ${method} ${url} (session: ${sessionId}) after ${elapsed}ms: ${err.message}`,
          err.stack,
        );
        throw err;
      }),
    );
  }
}
