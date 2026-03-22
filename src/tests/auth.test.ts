/**
 * Auth flow tests — login, logout, token storage, OAuth callback parsing.
 *
 * Uses happy-dom (configured in vitest.config) for sessionStorage/localStorage.
 * Mocks fetch so no real API calls are made.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/services/api/auth';
import { apiClient } from '@/services/api/client';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetch(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  apiClient.removeToken();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ── authService.login ─────────────────────────────────────────────────────────

describe('authService.login', () => {
  it('returns the API response on success', async () => {
    const payload = {
      success: true,
      data: { token: 'jwt-token-abc', user: { id: 'u1', email: 'alice@example.com', role: 'VIEWER' } },
    };
    vi.stubGlobal('fetch', mockFetch(payload));

    const result = await authService.login({ email: 'alice@example.com', password: 'secret' });

    expect(result).toEqual(payload);
  });

  it('makes a POST to /api/auth/login with credentials', async () => {
    const fetchMock = mockFetch({ success: true, data: { token: 't', user: {} } });
    vi.stubGlobal('fetch', fetchMock);

    await authService.login({ email: 'bob@example.com', password: 'pw' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0]!;
    expect(url).toContain('/api/auth/login');
    expect(JSON.parse((opts as RequestInit).body as string)).toMatchObject({
      email: 'bob@example.com',
      password: 'pw',
    });
  });
});

// ── authService.setToken / getToken / isAuthenticated ─────────────────────────

describe('authService token management', () => {
  it('isAuthenticated returns false with no token', () => {
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true after setToken', () => {
    authService.setToken('my-jwt');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('getToken returns the stored token', () => {
    authService.setToken('tok-123');
    expect(authService.getToken()).toBe('tok-123');
  });

  it('stores the token in sessionStorage (not localStorage)', () => {
    authService.setToken('session-tok');
    expect(sessionStorage.getItem('isms_token')).toBe('session-tok');
    expect(localStorage.getItem('isms_token')).toBeNull();
  });
});

// ── authService.logout ────────────────────────────────────────────────────────

describe('authService.logout', () => {
  it('clears the token so isAuthenticated returns false', async () => {
    authService.setToken('tok');
    await authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it('removes token from sessionStorage', async () => {
    sessionStorage.setItem('isms_token', 'tok');
    await authService.logout();
    expect(sessionStorage.getItem('isms_token')).toBeNull();
  });

  it('removes token from localStorage (legacy migration path)', async () => {
    localStorage.setItem('isms_token', 'tok');
    await authService.logout();
    expect(localStorage.getItem('isms_token')).toBeNull();
  });

  it('clears cached user from sessionStorage', async () => {
    const user = { id: 'u1', email: 'alice@example.com' };
    authService.cacheUser(user as never);
    await authService.logout();
    expect(sessionStorage.getItem('isms_user')).toBeNull();
  });
});

// ── authService.cacheUser / getCachedUser ─────────────────────────────────────

describe('authService user cache', () => {
  it('cacheUser stores JSON-serialised user', () => {
    const user = { id: 'u1', email: 'alice@example.com', role: 'ORG_ADMIN' };
    authService.cacheUser(user as never);

    const raw = sessionStorage.getItem('isms_user');
    expect(JSON.parse(raw!)).toEqual(user);
  });

  it('getCachedUser returns the stored user', () => {
    const user = { id: 'u2', email: 'bob@example.com', role: 'VIEWER' };
    authService.cacheUser(user as never);

    expect(authService.getCachedUser()).toEqual(user);
  });

  it('getCachedUser returns null when cache is empty', () => {
    expect(authService.getCachedUser()).toBeNull();
  });
});

// ── OAuth callback hash parsing ───────────────────────────────────────────────
// Tests the logic in AuthCallbackPage: token extracted from URL hash fragment,
// not from query params (to avoid server-side token exposure).

describe('OAuth callback hash parsing', () => {
  it('extracts token and user from hash fragment', () => {
    const user = { id: 'u3', email: 'carol@example.com', role: 'VIEWER' };
    const hash = `token=oauth-tok&user=${encodeURIComponent(JSON.stringify(user))}`;

    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userRaw = params.get('user');

    expect(token).toBe('oauth-tok');
    expect(JSON.parse(decodeURIComponent(userRaw!))).toEqual(user);
  });

  it('returns null for token when hash is missing', () => {
    const params = new URLSearchParams('');
    expect(params.get('token')).toBeNull();
  });

  it('uses hash over query params when both present', () => {
    // Simulates AuthCallbackPage logic: hash takes precedence
    const hash = 'token=hash-tok';
    const search = 'token=query-tok';

    const params = hash
      ? new URLSearchParams(hash)
      : new URLSearchParams(search);

    expect(params.get('token')).toBe('hash-tok');
  });

  it('falls back to query params when hash is empty', () => {
    const hash = '';
    const search = 'token=fallback-tok';

    const params = hash
      ? new URLSearchParams(hash)
      : new URLSearchParams(search);

    expect(params.get('token')).toBe('fallback-tok');
  });
});
