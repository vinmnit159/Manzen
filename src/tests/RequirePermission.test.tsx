/**
 * Tests for RBAC guard components:
 *   RequirePermission, RequireRole, AccessDenied, RoleBadge
 *
 * We mock authService.getCachedUser() to control the current user.
 */
import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Use vi.hoisted so mockGetCachedUser is available inside the factory
const { mockGetCachedUser } = vi.hoisted(() => ({
  mockGetCachedUser: vi.fn(),
}));

vi.mock('@/services/api/auth', () => ({
  authService: {
    getCachedUser: mockGetCachedUser,
  },
}));

// Mock react-router Navigate since we're not wrapping in a Router
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
  };
});

import {
  RequirePermission,
  RequireRole,
  AccessDenied,
  RoleBadge,
} from '@/app/components/rbac/RequirePermission';
import { PERMISSIONS } from '@/lib/rbac/permissions';

// ── Helper ────────────────────────────────────────────────────────────────────

function setUser(role: string) {
  mockGetCachedUser.mockReturnValue({
    id: 'u1',
    email: 'u@test.com',
    name: 'User',
    role,
    organizationId: 'org1',
  });
}

function clearUser() {
  mockGetCachedUser.mockReturnValue(null);
}

// ── RequirePermission ──────────────────────────────────────────────────────────

describe('RequirePermission', () => {
  afterEach(clearUser);

  it('renders children when user has the permission', () => {
    setUser('SUPER_ADMIN');
    render(
      <RequirePermission permission={PERMISSIONS.USERS_MANAGE}>
        <span>admin-only</span>
      </RequirePermission>,
    );
    expect(screen.getByText('admin-only')).toBeInTheDocument();
  });

  it('renders nothing when user lacks the permission', () => {
    setUser('VIEWER');
    render(
      <RequirePermission permission={PERMISSIONS.USERS_MANAGE}>
        <span>admin-only</span>
      </RequirePermission>,
    );
    expect(screen.queryByText('admin-only')).not.toBeInTheDocument();
  });

  it('renders fallback when user lacks the permission', () => {
    setUser('VIEWER');
    render(
      <RequirePermission permission={PERMISSIONS.USERS_MANAGE} fallback={<span>no-access</span>}>
        <span>admin-only</span>
      </RequirePermission>,
    );
    expect(screen.getByText('no-access')).toBeInTheDocument();
    expect(screen.queryByText('admin-only')).not.toBeInTheDocument();
  });

  it('renders nothing for unauthenticated user', () => {
    clearUser();
    render(
      <RequirePermission permission={PERMISSIONS.RISKS_READ}>
        <span>visible</span>
      </RequirePermission>,
    );
    expect(screen.queryByText('visible')).not.toBeInTheDocument();
  });
});

// ── RequireRole ────────────────────────────────────────────────────────────────

describe('RequireRole', () => {
  afterEach(clearUser);

  it('renders children when user has one of the allowed roles', () => {
    setUser('ORG_ADMIN');
    render(
      <RequireRole roles={['ORG_ADMIN', 'SECURITY_OWNER']}>
        <span>admin-content</span>
      </RequireRole>,
    );
    expect(screen.getByText('admin-content')).toBeInTheDocument();
  });

  it('renders nothing when user lacks all listed roles', () => {
    setUser('VIEWER');
    render(
      <RequireRole roles={['ORG_ADMIN', 'SECURITY_OWNER']}>
        <span>admin-content</span>
      </RequireRole>,
    );
    expect(screen.queryByText('admin-content')).not.toBeInTheDocument();
  });

  it('renders fallback when user lacks all listed roles', () => {
    setUser('CONTRIBUTOR');
    render(
      <RequireRole roles={['SUPER_ADMIN']} fallback={<span>fallback-role</span>}>
        <span>super-content</span>
      </RequireRole>,
    );
    expect(screen.getByText('fallback-role')).toBeInTheDocument();
    expect(screen.queryByText('super-content')).not.toBeInTheDocument();
  });
});

// ── AccessDenied ──────────────────────────────────────────────────────────────

describe('AccessDenied', () => {
  it('renders default title and message', () => {
    render(<AccessDenied />);
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You don't have permission/)).toBeInTheDocument();
  });

  it('renders custom title and message', () => {
    render(<AccessDenied title="Forbidden" message="Admins only." />);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
    expect(screen.getByText('Admins only.')).toBeInTheDocument();
  });

  it('renders requiredRole when provided', () => {
    render(<AccessDenied requiredRole="ORG_ADMIN" />);
    expect(screen.getByText('ORG_ADMIN')).toBeInTheDocument();
  });

  it('does not render required role when not provided', () => {
    render(<AccessDenied />);
    expect(screen.queryByText('Required role:')).not.toBeInTheDocument();
  });
});

// ── RoleBadge ─────────────────────────────────────────────────────────────────

describe('RoleBadge', () => {
  it('renders role label for VIEWER', () => {
    render(<RoleBadge role="VIEWER" />);
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('renders role label for SUPER_ADMIN', () => {
    render(<RoleBadge role="SUPER_ADMIN" />);
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
  });

  it('renders role label for AUDITOR', () => {
    render(<RoleBadge role="AUDITOR" />);
    expect(screen.getByText('Auditor')).toBeInTheDocument();
  });
});
