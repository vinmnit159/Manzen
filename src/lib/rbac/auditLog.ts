/**
 * RBAC Audit Log
 *
 * Records access control events locally (sessionStorage) and optionally
 * ships them to the backend audit endpoint.
 *
 * Events are structured as:
 *   { who, action, target, before, after, timestamp, ip }
 *
 * In production, replace the sessionStorage persistence with
 * POST /api/audit-log calls to the backend.
 */

export type AuditAction =
  | 'ROLE_ASSIGNED'
  | 'ROLE_REVOKED'
  | 'USER_INVITED'
  | 'USER_REMOVED'
  | 'ACCESS_REQUEST_CREATED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'PERMISSION_CHECKED'
  | 'ACCESS_DENIED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  /** Who performed the action */
  actorId: string;
  actorEmail: string;
  /** Who was affected (if applicable) */
  targetId?: string;
  targetEmail?: string;
  /** State before the action */
  before?: Record<string, unknown>;
  /** State after the action */
  after?: Record<string, unknown>;
  /** Additional context */
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = 'isms_rbac_audit_log';
const MAX_ENTRIES = 500;

function loadEntries(): AuditLogEntry[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: AuditLogEntry[]): void {
  try {
    // Keep only the most recent MAX_ENTRIES
    const trimmed = entries.slice(-MAX_ENTRIES);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage quota exceeded — clear and start fresh
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export const rbacAuditLog = {
  /**
   * Record an RBAC audit event.
   */
  record(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const entries = loadEntries();
    entries.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    });
    saveEntries(entries);

    // In production: ship to backend
    // apiClient.post('/api/audit-log', entry).catch(() => {});
  },

  /**
   * Get all audit log entries, newest first.
   */
  getAll(): AuditLogEntry[] {
    return loadEntries().reverse();
  },

  /**
   * Get entries filtered by action type.
   */
  getByAction(action: AuditAction): AuditLogEntry[] {
    return loadEntries().filter(e => e.action === action).reverse();
  },

  /**
   * Get entries for a specific user (as actor or target).
   */
  getByUser(userId: string): AuditLogEntry[] {
    return loadEntries()
      .filter(e => e.actorId === userId || e.targetId === userId)
      .reverse();
  },

  /**
   * Clear the audit log.
   */
  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  },

  // ── Convenience helpers ──────────────────────────────────────────────────

  logRoleChange(actor: { id: string; email: string }, target: { id: string; email: string }, fromRole: string, toRole: string) {
    this.record({
      action: 'ROLE_ASSIGNED',
      actorId: actor.id,
      actorEmail: actor.email,
      targetId: target.id,
      targetEmail: target.email,
      before: { role: fromRole },
      after: { role: toRole },
    });
  },

  logUserInvited(actor: { id: string; email: string }, invitedEmail: string, role: string) {
    this.record({
      action: 'USER_INVITED',
      actorId: actor.id,
      actorEmail: actor.email,
      targetEmail: invitedEmail,
      after: { role },
    });
  },

  logUserRemoved(actor: { id: string; email: string }, target: { id: string; email: string }) {
    this.record({
      action: 'USER_REMOVED',
      actorId: actor.id,
      actorEmail: actor.email,
      targetId: target.id,
      targetEmail: target.email,
    });
  },

  logAccessRequest(actor: { id: string; email: string }, requestId: string, requestedRole: string, type: string) {
    this.record({
      action: 'ACCESS_REQUEST_CREATED',
      actorId: actor.id,
      actorEmail: actor.email,
      metadata: { requestId, requestedRole, type },
    });
  },

  logAccessReview(reviewer: { id: string; email: string }, requestId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    this.record({
      action: decision === 'APPROVED' ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED',
      actorId: reviewer.id,
      actorEmail: reviewer.email,
      metadata: { requestId, note },
    });
  },

  logAccessDenied(userId: string, email: string, attemptedAction: string, resource: string) {
    this.record({
      action: 'ACCESS_DENIED',
      actorId: userId,
      actorEmail: email,
      metadata: { attemptedAction, resource },
    });
  },
};
