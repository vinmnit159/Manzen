import type { AppRole } from '@/lib/rbac/permissions';

// ── Helpers ────────────────────────────────────────────────────────────────────

export function initials(name?: string | null, email?: string) {
  if (name?.trim()) {
    const p = name.trim().split(/\s+/);
    return p.length >= 2 ? (p[0]!.charAt(0) + p[1]!.charAt(0)).toUpperCase() : p[0]!.slice(0, 2).toUpperCase();
  }
  return (email ?? 'U').slice(0, 2).toUpperCase();
}

export const ALL_ROLES: AppRole[] = ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR', 'CONTRIBUTOR', 'VIEWER'];
