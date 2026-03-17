import { describe, expect, it } from 'vitest';
import { requireAuth } from '@/app/authGuard';

describe('requireAuth', () => {
  it('redirects to login when no token is present', () => {
    sessionStorage.clear();
    localStorage.clear();

    const result = requireAuth();

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get('Location')).toBe('/login');
  });

  it('accepts a migrated legacy localStorage token', () => {
    sessionStorage.clear();
    localStorage.clear();
    localStorage.setItem('isms_token', 'legacy-token');

    const result = requireAuth();

    expect(result).toBeNull();
    expect(sessionStorage.getItem('isms_token')).toBe('legacy-token');
    expect(localStorage.getItem('isms_token')).toBeNull();
  });
});
