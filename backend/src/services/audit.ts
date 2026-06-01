import { db } from "../db.js";

export async function logAudit(opts: { userId?: string; action: string; entityType?: string; entityId?: string; metadata?: Record<string, unknown> }) {
  await db.auditLog.create({
    data: {
      userId: opts.userId,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    },
  });
}
