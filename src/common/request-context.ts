import { AsyncLocalStorage } from 'node:async_hooks';

export type RequestContextStore = {
  requestId?: string;
  userId?: number;
  ip?: string;
  userAgent?: string;

  // audit buffer for this request
  auditQueue?: Array<{
    action: string;
    tableName: string;
    entityId?: number | null;
    userId?: number;
    beforeData?: any;
    afterData?: any;
  }>;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestContext(): RequestContextStore {
  return requestContext.getStore() ?? {};
}
