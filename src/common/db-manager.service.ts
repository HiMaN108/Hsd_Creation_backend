import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import express from 'express';
import type { EntityManager } from 'typeorm';
import { JWTPayload } from './interfaces/auth.interface';
import type { RequestDbQueryRunner } from './db-query-runner.type';

declare module 'express-serve-static-core' {
  interface Request {
    dbQueryRunner?: RequestDbQueryRunner;
    user?: JWTPayload;
  }
}

@Injectable({ scope: Scope.REQUEST })
export class DbManagerService {
  constructor(@Inject(REQUEST) private readonly req: express.Request) {}

  get manager(): EntityManager {
    const qr = this.req.dbQueryRunner;
    if (!qr) {
      throw new Error('QueryRunner not found on request');
    }
    return qr.manager;
  }
}
