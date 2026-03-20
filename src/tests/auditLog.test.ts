import { describe, it, expect, beforeEach } from 'vitest';
import { rbacAuditLog } from '@/lib/rbac/auditLog';

// happy-dom provides sessionStorage, so this test runs without any mocking

describe('rbacAuditLog', () => {
  beforeEach(() => {
    rbacAuditLog.clear();
  });

  describe('record', () => {
    it('persists an entry retrievable via getAll', () => {
      rbacAuditLog.record({
        action: 'ROLE_ASSIGNED',
        actorId: 'u1',
        actorEmail: 'admin@example.com',
      });

      const entries = rbacAuditLog.getAll();
      expect(entries).toHaveLength(1);
      expect(entries[0]!.action).toBe('ROLE_ASSIGNED');
      expect(entries[0]!.actorId).toBe('u1');
    });

    it('assigns a unique id and ISO timestamp to each entry', () => {
      rbacAuditLog.record({ action: 'USER_INVITED', actorId: 'u1', actorEmail: 'a@b.com' });
      rbacAuditLog.record({ action: 'USER_INVITED', actorId: 'u1', actorEmail: 'a@b.com' });

      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.id).not.toBe(entries[1]!.id);
      // ISO 8601 format check
      expect(new Date(entries[0]!.timestamp).toISOString()).toBe(entries[0]!.timestamp);
    });

    it('stores multiple entries in order (newest first via getAll)', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      rbacAuditLog.record({ action: 'USER_REMOVED', actorId: 'u2', actorEmail: 'b@b.com' });

      const entries = rbacAuditLog.getAll();
      // getAll returns newest first (reversed)
      expect(entries[0]!.action).toBe('USER_REMOVED');
      expect(entries[1]!.action).toBe('ROLE_ASSIGNED');
    });

    it('stores optional metadata fields', () => {
      rbacAuditLog.record({
        action: 'ACCESS_DENIED',
        actorId: 'u1',
        actorEmail: 'a@b.com',
        metadata: { resource: '/admin', attemptedAction: 'DELETE' },
        before: { role: 'VIEWER' },
        after: { role: 'ORG_ADMIN' },
      });
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.metadata?.resource).toBe('/admin');
      expect(entries[0]!.before?.role).toBe('VIEWER');
      expect(entries[0]!.after?.role).toBe('ORG_ADMIN');
    });
  });

  describe('getAll', () => {
    it('returns empty array when no entries', () => {
      expect(rbacAuditLog.getAll()).toEqual([]);
    });

    it('returns all entries newest first', () => {
      for (let i = 0; i < 5; i++) {
        rbacAuditLog.record({ action: 'PERMISSION_CHECKED', actorId: `u${i}`, actorEmail: `u${i}@b.com` });
      }
      const entries = rbacAuditLog.getAll();
      expect(entries).toHaveLength(5);
      // newest actorId should be u4
      expect(entries[0]!.actorId).toBe('u4');
    });
  });

  describe('getByAction', () => {
    it('filters by action type', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      rbacAuditLog.record({ action: 'USER_REMOVED', actorId: 'u2', actorEmail: 'b@b.com' });
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u3', actorEmail: 'c@b.com' });

      const entries = rbacAuditLog.getByAction('ROLE_ASSIGNED');
      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.action === 'ROLE_ASSIGNED')).toBe(true);
    });

    it('returns empty array if no entries match', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      expect(rbacAuditLog.getByAction('ACCESS_DENIED')).toEqual([]);
    });
  });

  describe('getByUser', () => {
    it('returns entries where user is actor', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u2', actorEmail: 'b@b.com' });

      const entries = rbacAuditLog.getByUser('u1');
      expect(entries).toHaveLength(1);
      expect(entries[0]!.actorId).toBe('u1');
    });

    it('returns entries where user is target', () => {
      rbacAuditLog.record({
        action: 'USER_REMOVED',
        actorId: 'admin',
        actorEmail: 'admin@b.com',
        targetId: 'u5',
        targetEmail: 'u5@b.com',
      });

      const entries = rbacAuditLog.getByUser('u5');
      expect(entries).toHaveLength(1);
    });

    it('returns empty array for unknown user', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      expect(rbacAuditLog.getByUser('nobody')).toEqual([]);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      rbacAuditLog.record({ action: 'ROLE_ASSIGNED', actorId: 'u1', actorEmail: 'a@b.com' });
      rbacAuditLog.record({ action: 'USER_REMOVED', actorId: 'u2', actorEmail: 'b@b.com' });
      rbacAuditLog.clear();
      expect(rbacAuditLog.getAll()).toEqual([]);
    });
  });

  describe('convenience helpers', () => {
    it('logRoleChange records ROLE_ASSIGNED with before/after', () => {
      rbacAuditLog.logRoleChange(
        { id: 'admin', email: 'admin@test.com' },
        { id: 'user1', email: 'user1@test.com' },
        'VIEWER',
        'CONTRIBUTOR',
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('ROLE_ASSIGNED');
      expect(entries[0]!.before?.role).toBe('VIEWER');
      expect(entries[0]!.after?.role).toBe('CONTRIBUTOR');
      expect(entries[0]!.targetId).toBe('user1');
    });

    it('logUserInvited records USER_INVITED with role', () => {
      rbacAuditLog.logUserInvited(
        { id: 'admin', email: 'admin@test.com' },
        'newuser@test.com',
        'VIEWER',
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('USER_INVITED');
      expect(entries[0]!.after?.role).toBe('VIEWER');
      expect(entries[0]!.targetEmail).toBe('newuser@test.com');
    });

    it('logUserRemoved records USER_REMOVED', () => {
      rbacAuditLog.logUserRemoved(
        { id: 'admin', email: 'admin@test.com' },
        { id: 'user2', email: 'user2@test.com' },
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('USER_REMOVED');
      expect(entries[0]!.targetId).toBe('user2');
    });

    it('logAccessRequest records ACCESS_REQUEST_CREATED', () => {
      rbacAuditLog.logAccessRequest(
        { id: 'u1', email: 'u1@test.com' },
        'req-123',
        'ORG_ADMIN',
        'role-upgrade',
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('ACCESS_REQUEST_CREATED');
      expect(entries[0]!.metadata?.requestId).toBe('req-123');
      expect(entries[0]!.metadata?.requestedRole).toBe('ORG_ADMIN');
    });

    it('logAccessReview records APPROVED decision', () => {
      rbacAuditLog.logAccessReview(
        { id: 'rev', email: 'rev@test.com' },
        'req-456',
        'APPROVED',
        'looks good',
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('ACCESS_REQUEST_APPROVED');
      expect(entries[0]!.metadata?.note).toBe('looks good');
    });

    it('logAccessReview records REJECTED decision', () => {
      rbacAuditLog.logAccessReview(
        { id: 'rev', email: 'rev@test.com' },
        'req-789',
        'REJECTED',
      );
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('ACCESS_REQUEST_REJECTED');
    });

    it('logAccessDenied records ACCESS_DENIED', () => {
      rbacAuditLog.logAccessDenied('u3', 'u3@test.com', 'DELETE', '/api/risks');
      const entries = rbacAuditLog.getAll();
      expect(entries[0]!.action).toBe('ACCESS_DENIED');
      expect(entries[0]!.metadata?.resource).toBe('/api/risks');
      expect(entries[0]!.metadata?.attemptedAction).toBe('DELETE');
    });
  });
});
