import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpRequestLoggerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const start = Date.now();
    const path = req.originalUrl ?? req.url ?? '';
    return next.handle().pipe(
      tap({
        finalize: () => {
          const line = JSON.stringify({
            level: 'info',
            msg: 'http_request',
            method: req.method,
            path,
            status: res.statusCode,
            durationMs: Date.now() - start,
          });
          console.log(line);
        },
      }),
    );
  }
}
