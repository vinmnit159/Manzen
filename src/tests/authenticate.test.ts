/**
 * Tests for src/server/middleware/authenticate.ts
 *
 * The middleware has two modes depending on BACKEND_JWT_SECRET:
 *   - Absent → decode-only (no signature check)
 *   - Present → HS256 signature verification
 *
 * Because JWT_SECRET is captured at module load time we use
 * vi.resetModules() + a dynamic import to re-evaluate the module with a
 * different environment variable for the "with secret" suite.
 *
 * No real DB or HTTP server is needed — we drive the exported function
 * directly with fake Fastify request/reply objects.
 */

import crypto from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── JWT helpers ───────────────────────────────────────────────────────────────

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * Build a minimal HS256 JWT signed with `secret`.
 * If `secret` is empty the signature segment is set to a dummy value,
 * matching what happens in decode-only mode where the signature is never
 * checked.
 */
function makeJwt(payload: Record<string, unknown>, secret = ''): string {
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const body = b64url(payload);
  const signingInput = `${header}.${body}`;
  const sig = secret
    ? crypto.createHmac('sha256', secret).update(signingInput).digest('base64url')
    : 'unsigned';
  return `${signingInput}.${sig}`;
}

/** Future expiry (1 hour from now, in seconds). */
function futureExp(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

/** Past expiry (1 hour ago, in seconds). */
function pastExp(): number {
  return Math.floor(Date.now() / 1000) - 3600;
}

// ── Fake Fastify primitives ───────────────────────────────────────────────────

function makeFakeReply() {
  const reply = {
    _status: 0,
    _body: undefined as unknown,
    code(status: number) {
      reply._status = status;
      return reply;
    },
    send(body: unknown) {
      reply._body = body;
      return reply;
    },
  };
  return reply;
}

type FakeReply = ReturnType<typeof makeFakeReply>;

function makeFakeRequest(overrides: {
  method?: string;
  authorization?: string;
}): { method: string; headers: Record<string, string | undefined>; user?: unknown } {
  return {
    method: overrides.method ?? 'POST',
    headers: {
      authorization: overrides.authorization,
    },
  };
}

// ── Mock the notifications module ─────────────────────────────────────────────
// authenticate.ts calls getNotificationServiceOrNull() as a side-effect.
// We don't want that touching Postgres in tests.

vi.mock('@/server/notifications/module', () => ({
  getNotificationServiceOrNull: () => null,
}));

// ── Suite A: decode-only mode (BACKEND_JWT_SECRET not set) ────────────────────

describe('authenticate — decode-only mode (no BACKEND_JWT_SECRET)', () => {
  // Ensure the env var is absent for this suite.
  beforeEach(() => {
    delete process.env.BACKEND_JWT_SECRET;
    vi.unstubAllEnvs();
  });

  // Import once for this suite block.  The module is evaluated without a
  // JWT_SECRET so it runs in decode-only mode.
  async function getAuthenticate() {
    const mod = await import('@/server/middleware/authenticate');
    return mod.authenticate;
  }

  it('passes a valid JWT (no signature check) and attaches request.user', async () => {
    const authenticate = await getAuthenticate();
    const token = makeJwt({
      sub: 'user-1',
      email: 'alice@example.com',
      role: 'ORG_ADMIN',
      organizationId: 'org-abc',
      exp: futureExp(),
    });
    const req = makeFakeRequest({ authorization: `Bearer ${token}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(0); // no error response sent
    expect((req as { user?: unknown }).user).toMatchObject({
      id: 'user-1',
      email: 'alice@example.com',
      role: 'ORG_ADMIN',
      organizationId: 'org-abc',
    });
  });

  it('returns 401 for a token with a malformed structure (not 3 parts)', async () => {
    const authenticate = await getAuthenticate();
    const req = makeFakeRequest({ authorization: 'Bearer not.a.valid.jwt.at.all' });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: string }).error).toMatch(/invalid token/i);
  });

  it('returns 401 when the payload is not valid JSON (corrupted base64)', async () => {
    const authenticate = await getAuthenticate();
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const malformedToken = `${header}.!!!bad-base64!!!.sig`;
    const req = makeFakeRequest({ authorization: `Bearer ${malformedToken}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
  });

  it('returns 401 for an expired token (exp in the past)', async () => {
    const authenticate = await getAuthenticate();
    const token = makeJwt({
      sub: 'user-2',
      email: 'bob@example.com',
      role: 'VIEWER',
      organizationId: 'org-xyz',
      exp: pastExp(),
    });
    const req = makeFakeRequest({ authorization: `Bearer ${token}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: string }).error).toMatch(/invalid token/i);
  });

  it('returns 401 when the Authorization header is missing entirely', async () => {
    const authenticate = await getAuthenticate();
    const req = makeFakeRequest({});
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: string }).error).toMatch(/authentication required/i);
  });

  it('returns 401 when the Authorization header does not start with "Bearer "', async () => {
    const authenticate = await getAuthenticate();
    const req = makeFakeRequest({ authorization: 'Basic dXNlcjpwYXNz' });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: string }).error).toMatch(/authentication required/i);
  });

  it('bypasses auth entirely for OPTIONS preflight requests', async () => {
    const authenticate = await getAuthenticate();
    // No Authorization header — would 401 for any other method.
    const req = makeFakeRequest({ method: 'OPTIONS' });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(0);   // no response sent
    expect((req as { user?: unknown }).user).toBeUndefined();
  });
});

// ── Suite B: signature verification mode (BACKEND_JWT_SECRET set) ─────────────

describe('authenticate — signature verification mode (BACKEND_JWT_SECRET set)', () => {
  const TEST_SECRET = 'super-secret-for-tests-only';

  /**
   * Re-evaluate the module with BACKEND_JWT_SECRET set so that JWT_SECRET is
   * populated at module load time.  vi.resetModules() clears the module cache
   * and vi.stubEnv() injects the env var before the dynamic import runs.
   * The notifications mock is already hoisted at the file level so it persists
   * across resets automatically.
   */
  async function getAuthenticateWithSecret() {
    vi.resetModules();
    vi.stubEnv('BACKEND_JWT_SECRET', TEST_SECRET);
    const mod = await import('@/server/middleware/authenticate');
    return mod.authenticate;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accepts a token whose signature matches BACKEND_JWT_SECRET', async () => {
    const authenticate = await getAuthenticateWithSecret();
    const token = makeJwt(
      { sub: 'user-3', email: 'carol@example.com', role: 'VIEWER', organizationId: 'org-1', exp: futureExp() },
      TEST_SECRET,
    );
    const req = makeFakeRequest({ authorization: `Bearer ${token}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(0);
    expect((req as { user?: { id: string } }).user?.id).toBe('user-3');
  });

  it('returns 401 for a tampered payload (valid format but wrong signature)', async () => {
    const authenticate = await getAuthenticateWithSecret();
    // Sign with a different secret so the signature does not match TEST_SECRET.
    const tamperedToken = makeJwt(
      { sub: 'attacker', email: 'evil@example.com', role: 'ORG_ADMIN', organizationId: 'org-other', exp: futureExp() },
      'wrong-secret',
    );
    const req = makeFakeRequest({ authorization: `Bearer ${tamperedToken}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
    expect((reply._body as { error: string }).error).toMatch(/invalid token/i);
  });

  it('returns 401 when the header is signed with the right secret but the token has expired', async () => {
    const authenticate = await getAuthenticateWithSecret();
    const token = makeJwt(
      { sub: 'user-4', email: 'dave@example.com', role: 'VIEWER', organizationId: 'org-2', exp: pastExp() },
      TEST_SECRET,
    );
    const req = makeFakeRequest({ authorization: `Bearer ${token}` });
    const reply = makeFakeReply();

    await authenticate(req as never, reply as never);

    expect(reply._status).toBe(401);
  });
});
