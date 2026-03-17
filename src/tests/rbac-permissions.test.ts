import { describe, it, expect } from 'vitest';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  roleHasPermission,
  type AppRole,
  type Permission,
} from '../lib/rbac/permissions';

describe('Frontend RBAC - ROLE_PERMISSIONS', () => {
  describe('SUPER_ADMIN', () => {
    const role: AppRole = 'SUPER_ADMIN';

    it('should have all read permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.EVIDENCE_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.POLICIES_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.TESTS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.USERS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.ASSETS_READ)).toBe(true);
    });

    it('should have all write permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_WRITE)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_WRITE)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.EVIDENCE_UPLOAD)).toBe(true);
    });

    it('should have admin-only permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.PLATFORM_ADMIN)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.USERS_MANAGE)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.USERS_ROLES_ASSIGN)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.ORG_SETTINGS)).toBe(true);
    });
  });

  describe('VIEWER', () => {
    const role: AppRole = 'VIEWER';

    it('should only have read-level permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.EVIDENCE_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.TESTS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.ASSETS_READ)).toBe(true);
    });

    it('should not have write permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_WRITE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_WRITE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.TESTS_WRITE)).toBe(false);
    });

    it('should not have management or admin permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.USERS_MANAGE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.PLATFORM_ADMIN)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.ORG_SETTINGS)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.INTEGRATIONS_MANAGE)).toBe(false);
    });
  });

  describe('AUDITOR', () => {
    const role: AppRole = 'AUDITOR';

    it('should be able to read all compliance resources', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.EVIDENCE_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.POLICIES_READ)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.AUDITS_READ)).toBe(true);
    });

    it('should be able to conduct audits and write findings', () => {
      expect(roleHasPermission(role, PERMISSIONS.AUDITS_CONDUCT)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.FINDINGS_WRITE)).toBe(true);
    });

    it('should not be able to write risks or controls', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_WRITE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.CONTROLS_WRITE)).toBe(false);
    });

    it('should not have admin permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.USERS_MANAGE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.PLATFORM_ADMIN)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.ORG_SETTINGS)).toBe(false);
    });
  });

  describe('CONTRIBUTOR', () => {
    const role: AppRole = 'CONTRIBUTOR';

    it('should be able to write risks, tests and upload evidence', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_WRITE)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.EVIDENCE_UPLOAD)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.TESTS_WRITE)).toBe(true);
      expect(roleHasPermission(role, PERMISSIONS.TESTS_RUN)).toBe(true);
    });

    it('should not be able to delete or approve', () => {
      expect(roleHasPermission(role, PERMISSIONS.RISKS_DELETE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.RISKS_ACCEPT)).toBe(false);
    });

    it('should not have admin permissions', () => {
      expect(roleHasPermission(role, PERMISSIONS.USERS_MANAGE)).toBe(false);
      expect(roleHasPermission(role, PERMISSIONS.PLATFORM_ADMIN)).toBe(false);
    });
  });

  describe('roleHasPermission - edge cases', () => {
    it('should return false for unknown permission on any role', () => {
      expect(roleHasPermission('VIEWER', 'unknown:permission' as Permission)).toBe(false);
    });

    it('should be consistent — same role/permission always returns same value', () => {
      const result1 = roleHasPermission('ORG_ADMIN', PERMISSIONS.USERS_MANAGE);
      const result2 = roleHasPermission('ORG_ADMIN', PERMISSIONS.USERS_MANAGE);
      expect(result1).toBe(result2);
    });
  });

  describe('ROLE_PERMISSIONS completeness', () => {
    const allRoles: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR', 'CONTRIBUTOR', 'VIEWER'];

    it('should define permissions for all roles', () => {
      for (const role of allRoles) {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      }
    });

    it('SUPER_ADMIN should have more permissions than VIEWER', () => {
      const superAdminCount = ROLE_PERMISSIONS['SUPER_ADMIN'].length;
      const viewerCount = ROLE_PERMISSIONS['VIEWER'].length;
      expect(superAdminCount).toBeGreaterThan(viewerCount);
    });

    it('VIEWER permissions should be a subset of SUPER_ADMIN permissions', () => {
      const superAdminPerms = new Set(ROLE_PERMISSIONS['SUPER_ADMIN']);
      for (const perm of ROLE_PERMISSIONS['VIEWER']) {
        expect(superAdminPerms.has(perm)).toBe(true);
      }
    });
  });
});
