import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>(); // Ensure the correct Request type is used

    return next.handle().pipe(
      map((data: unknown) => {
        const statusCode = response.statusCode || HttpStatus.OK;

        return {
          success: true,
          data: data ?? null,
          statusCode,
          message: 'Request successful',
          path: request.originalUrl,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
