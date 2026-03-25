/* eslint-disable @typescript-eslint/no-unused-vars */ /* eslint-disable no-empty */ /* eslint-disable @typescript-eslint/no-unsafe-return */ /* eslint-disable @typescript-eslint/no-unsafe-argument */ /* eslint-disable @typescript-eslint/no-unsafe-member-access */ /* eslint-disable @typescript-eslint/no-unsafe-assignment */

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, from, throwError } from 'rxjs';
import { catchError, finalize, mergeMap } from 'rxjs/operators';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import type { Request } from 'express';
import type { RequestDbQueryRunner } from './db-query-runner.type';
import { JWTPayload } from './interfaces/auth.interface';

declare module 'express-serve-static-core' {
  interface Request {
    dbQueryRunner?: RequestDbQueryRunner;
    user?: JWTPayload;
  }
}

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(private readonly dataSource: DataSource) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const user = req.user;

    const qr = this.dataSource.createQueryRunner();
    const requestId = randomUUID();

    return new Observable((subscriber) => {
      requestContext.run(
        {
          requestId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          userId: user?.id,
          auditQueue: [],
        },
        () => {
          from(this.initQueryRunner(qr))
            .pipe(
              mergeMap(() => {
                req.dbQueryRunner = qr;
                return next.handle();
              }),
              catchError((err) =>
                from(this.rollbackSilently(qr)).pipe(
                  mergeMap(() => throwError(() => err)),
                ),
              ),
              finalize(() => {
                void this.commitAndReleaseSilently(qr);
              }),
            )
            .subscribe({
              next: (v) => subscriber.next(v),
              error: (e) => subscriber.error(e),
              complete: () => subscriber.complete(),
            });
        },
      );
    });
  }

  private async initQueryRunner(qr: RequestDbQueryRunner) {
    await qr.connect();
    await qr.startTransaction();
  }

  private async rollbackSilently(qr: RequestDbQueryRunner) {
    try {
      if (qr.isTransactionActive) {
        await qr.rollbackTransaction();
      }
    } catch {}
  }

  private async commitAndReleaseSilently(qr: RequestDbQueryRunner) {
    try {
      if (qr.isTransactionActive) {
        await qr.commitTransaction();
      }
    } catch {
      await this.rollbackSilently(qr);
    } finally {
      try {
        if (!qr.isReleased) {
          await qr.release();
        }
      } catch (err) {
        console.error('Error releasing query runner:', err);
      }
    }
  }
}
