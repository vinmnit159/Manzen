import { authService } from '@/services/api/auth';

// Lightweight synchronous hook — reads the cached user from localStorage.
// No React state; components using this will get the value at render time.
// For reactive updates (e.g. after login), components should re-mount or
// use a parent state that refreshes on route change.

export type AppRole =
  | 'SUPER_ADMIN'
  | 'ORG_ADMIN'
  | 'SECURITY_OWNER'
  | 'AUDITOR'
  | 'CONTRIBUTOR'
  | 'VIEWER';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  organizationId: string;
}

export function useCurrentUser(): CurrentUser | null {
  const raw = authService.getCachedUser();
  if (!raw) return null;
  return raw as unknown as CurrentUser;
}

export function useIsAdmin(): boolean {
  const user = useCurrentUser();
  return ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER'].includes(user?.role ?? '');
}

export function useIsAuditor(): boolean {
  return useCurrentUser()?.role === 'AUDITOR';
}

export function useCanAudit(): boolean {
  const user = useCurrentUser();
  return ['SUPER_ADMIN', 'ORG_ADMIN', 'SECURITY_OWNER', 'AUDITOR'].includes(user?.role ?? '');
}
