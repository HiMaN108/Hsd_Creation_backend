import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  SoftRemoveEvent,
  RecoverEvent,
  ObjectLiteral,
  QueryDeepPartialEntity,
} from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { requestContext, RequestContextStore } from '../request-context';

function safeClone<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(private readonly dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  /**
   * Listen to ALL entities.
   * We manually exclude audit_logs inside queue().
   */
  listenTo() {
    return Object;
  }

  /* ===========================
     ENTITY EVENTS
  =========================== */

  afterInsert(event: InsertEvent<ObjectLiteral>) {
    this.queue(event, 'INSERT', undefined, event.entity);
  }

  afterUpdate(event: UpdateEvent<ObjectLiteral>) {
    const before = event.databaseEntity
      ? safeClone(event.databaseEntity)
      : undefined;

    const after = event.entity ? safeClone(event.entity) : undefined;

    this.queue(event, 'UPDATE', before, after);
  }

  afterRemove(event: RemoveEvent<ObjectLiteral>) {
    const before = event.databaseEntity
      ? safeClone(event.databaseEntity)
      : undefined;

    this.queue(event, 'DELETE', before, undefined);
  }

  afterSoftRemove(event: SoftRemoveEvent<ObjectLiteral>) {
    const before = event.databaseEntity
      ? safeClone(event.databaseEntity)
      : undefined;

    const after = event.entity ? safeClone(event.entity) : undefined;

    this.queue(event, 'SOFT_DELETE', before, after);
  }

  afterRecover(event: RecoverEvent<ObjectLiteral>) {
    const before = event.databaseEntity
      ? safeClone(event.databaseEntity)
      : undefined;

    const after = event.entity ? safeClone(event.entity) : undefined;

    this.queue(event, 'RESTORE', before, after);
  }

  /**
   * Flush audit queue AFTER transaction commit.
   * Best-effort only — audit must NEVER break business logic.
   */
  afterTransactionCommit(): void {
    const ctx = requestContext.getStore();
    if (!ctx) return; // No request context (e.g. startup, migrations)

    const queue = ctx.auditQueue ?? [];

    if (!queue.length) return;

    // Clear immediately to prevent duplicates
    ctx.auditQueue = [];

    // Run outside request lifecycle (non-blocking)
    setImmediate(() => {
      void this.flushQueue(queue, ctx).catch(() => undefined);
    });
  }

  /* ===========================
     QUEUE BUILDER
  =========================== */

  private queue(
    event:
      | InsertEvent<ObjectLiteral>
      | UpdateEvent<ObjectLiteral>
      | RemoveEvent<ObjectLiteral>
      | SoftRemoveEvent<ObjectLiteral>
      | RecoverEvent<ObjectLiteral>,
    action: string,
    beforeData?: any,
    afterData?: any,
  ) {
    const metadata = event.metadata;
    if (!metadata) return;

    // Skip audit table itself
    if (metadata.tableName === 'audit_logs') return;

    // Ignore internal or junction tables
    if (metadata.tableType !== 'regular') return;

    const ctx = requestContext.getStore();
    if (!ctx) return; // No request context — skip audit

    const entityId = afterData?.id ?? beforeData?.id;

    const userId = ctx.userId;

    (ctx.auditQueue ??= []).push({
      action,
      tableName: metadata.tableName,
      entityId,
      userId,
      beforeData,
      afterData,
    });
  }

  /* ===========================
     FLUSH (MYSQL SAFE)
  =========================== */

  private async flushQueue(
    queue: Array<{
      action: string;
      tableName: string;
      entityId?: string | null;
      userId?: string | null;
      beforeData?: any;
      afterData?: any;
    }>,
    ctx: RequestContextStore,
  ) {
    const qr = this.dataSource.createQueryRunner();

    try {
      await qr.connect();

      const repo = qr.manager.getRepository(AuditLog);

      const rows: QueryDeepPartialEntity<AuditLog>[] = queue.map((q) => ({
        userId: toNullableString(q.userId),
        action: q.action,
        tableName: q.tableName,
        entityId: toNullableString(q.entityId),
        beforeData: (q.beforeData as unknown) ?? null,
        afterData: (q.afterData as unknown) ?? null,
        requestId: ctx.requestId ?? null,
        ipAddress: ctx.ip ?? null,
        userAgent: ctx.userAgent ?? null,
      }));

      // Bulk insert (fast, single roundtrip)
      await repo.insert(rows);
    } catch {
      // Never throw. Audit must never affect core logic.
    } finally {
      await qr.release().catch(() => undefined);
    }
  }
}
