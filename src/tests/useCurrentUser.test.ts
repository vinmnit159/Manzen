/**
 * Tests for useCurrentUser and related hooks.
 *
 * We mock authService.getCachedUser() directly to avoid issues with
 * the ApiClient singleton calling localStorage.getItem at import time.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';

// Use vi.hoisted so mockGetCachedUser is available inside the factory
const { mockGetCachedUser } = vi.hoisted(() => ({
  mockGetCachedUser: vi.fn(),
}));

vi.mock('@/services/api/auth', () => ({
  authService: {
    getCachedUser: mockGetCachedUser,
  },
}));

import {
  useCurrentUser,
  useIsAdmin,
  useIsAuditor,
  useCanAudit,
  useHasRole,
  useHasPermission,
  usePermissions,
  usePermissionChecker,
} from '@/hooks/useCurrentUser';
import { PERMISSIONS } from '@/lib/rbac/permissions';

// ── Helpers ────────────────────────────────────────────────────────────────────

function setUser(role: string) {
  mockGetCachedUser.mockReturnValue({
    id: 'u1',
    email: 'test@example.com',
    name: 'Test User',
    role,
    organizationId: 'org-1',
  });
}

function clearUser() {
  mockGetCachedUser.mockReturnValue(null);
}

// ── useCurrentUser ────────────────────────────────────────────────────────────

describe('useCurrentUser', () => {
  afterEach(clearUser);

  it('returns null when no user is cached', () => {
    clearUser();
    expect(useCurrentUser()).toBeNull();
  });

  it('returns parsed user when cached', () => {
    setUser('VIEWER');
    const user = useCurrentUser();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('VIEWER');
    expect(user?.email).toBe('test@example.com');
  });
});

// ── useIsAdmin ────────────────────────────────────────────────────────────────

describe('useIsAdmin', () => {
  afterEach(clearUser);

  it.each(['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'])('%s is admin', (role) => {
    setUser(role);
    expect(useIsAdmin()).toBe(true);
  });

  it.each(['AUDITOR', 'CONTRIBUTOR', 'VIEWER'])('%s is not admin', (role) => {
    setUser(role);
    expect(useIsAdmin()).toBe(false);
  });

  it('returns false for unauthenticated user', () => {
    clearUser();
    expect(useIsAdmin()).toBe(false);
  });
});

// ── useIsAuditor ──────────────────────────────────────────────────────────────

describe('useIsAuditor', () => {
  afterEach(clearUser);

  it('returns true for AUDITOR role', () => {
    setUser('AUDITOR');
    expect(useIsAuditor()).toBe(true);
  });

  it.each(['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'CONTRIBUTOR', 'VIEWER'])(
    '%s is not auditor',
    (role) => {
      setUser(role);
      expect(useIsAuditor()).toBe(false);
    },
  );
});

// ── useCanAudit ───────────────────────────────────────────────────────────────

describe('useCanAudit', () => {
  afterEach(clearUser);

  it.each(['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR'])(
    '%s can audit',
    (role) => {
      setUser(role);
      expect(useCanAudit()).toBe(true);
    },
  );

  it.each(['CONTRIBUTOR', 'VIEWER'])('%s cannot audit', (role) => {
    setUser(role);
    expect(useCanAudit()).toBe(false);
  });
});

// ── useHasRole ────────────────────────────────────────────────────────────────

describe('useHasRole', () => {
  afterEach(clearUser);

  it('returns true when user has one of the listed roles', () => {
    setUser('CONTRIBUTOR');
    expect(useHasRole('CONTRIBUTOR', 'VIEWER')).toBe(true);
  });

  it('returns false when user has none of the listed roles', () => {
    setUser('VIEWER');
    expect(useHasRole('SUPER_ADMIN', 'ORG_ADMIN')).toBe(false);
  });

  it('returns false when unauthenticated', () => {
    clearUser();
    expect(useHasRole('VIEWER')).toBe(false);
  });
});

// ── useHasPermission ──────────────────────────────────────────────────────────

describe('useHasPermission', () => {
  afterEach(clearUser);

  it('returns true for permissions the role has', () => {
    setUser('SUPER_ADMIN');
    expect(useHasPermission(PERMISSIONS.USERS_MANAGE)).toBe(true);
    expect(useHasPermission(PERMISSIONS.RISKS_WRITE)).toBe(true);
  });

  it('returns false for permissions the role lacks', () => {
    setUser('VIEWER');
    expect(useHasPermission(PERMISSIONS.USERS_MANAGE)).toBe(false);
    expect(useHasPermission(PERMISSIONS.RISKS_DELETE)).toBe(false);
  });

  it('returns false for unauthenticated user', () => {
    clearUser();
    expect(useHasPermission(PERMISSIONS.RISKS_READ)).toBe(false);
  });
});

// ── usePermissions ────────────────────────────────────────────────────────────

describe('usePermissions', () => {
  afterEach(clearUser);

  it('returns non-empty array for authenticated user', () => {
    setUser('CONTRIBUTOR');
    const perms = usePermissions();
    expect(perms.length).toBeGreaterThan(0);
  });

  it('returns empty array for unauthenticated user', () => {
    clearUser();
    expect(usePermissions()).toEqual([]);
  });

  it('SUPER_ADMIN has more permissions than VIEWER', () => {
    setUser('SUPER_ADMIN');
    const adminPerms = usePermissions();
    setUser('VIEWER');
    const viewerPerms = usePermissions();
    expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
  });
});

// ── usePermissionChecker ──────────────────────────────────────────────────────

describe('usePermissionChecker', () => {
  afterEach(clearUser);

  it('returns a function that checks permissions', () => {
    setUser('CONTRIBUTOR');
    const can = usePermissionChecker();
    expect(typeof can).toBe('function');
  });

  it('checker returns true for held permissions', () => {
    setUser('CONTRIBUTOR');
    const can = usePermissionChecker();
    expect(can(PERMISSIONS.RISKS_READ)).toBe(true);
  });

  it('checker returns false for missing permissions', () => {
    setUser('CONTRIBUTOR');
    const can = usePermissionChecker();
    expect(can(PERMISSIONS.USERS_MANAGE)).toBe(false);
  });

  it('checker returns false for all perms when unauthenticated', () => {
    clearUser();
    const can = usePermissionChecker();
    expect(can(PERMISSIONS.RISKS_READ)).toBe(false);
  });
});
