/**
 * Server-side JWT authentication middleware for Fastify.
 *
 * Usage in a route definition:
 *   preHandler: [authenticate]
 *
 * Attaches `request.user` with { id, email, role, organizationId } if valid.
 * Responds with 401 if the token is missing, invalid, or (when BACKEND_JWT_SECRET
 * is configured) fails signature verification.
 *
 * ## Signature verification
 * Set BACKEND_JWT_SECRET to the same HS256 secret used by the isms-backend to sign
 * JWTs.  When set, this middleware verifies the HMAC-SHA256 signature and rejects
 * any token whose signature does not match — preventing forged claims for role or
 * organizationId.
 *
 * Without BACKEND_JWT_SECRET (development only) the middleware falls back to
 * decode-only mode and logs a warning on startup.
 */

import crypto from 'crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { getNotificationServiceOrNull } from '@/server/notifications/module';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  organizationId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

// ── JWT secret (optional — falls back to decode-only in dev) ──────────────────

const JWT_SECRET = process.env.BACKEND_JWT_SECRET ?? '';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  // Hard-fail at startup rather than silently allowing forged tokens in prod.
  throw new Error(
    'BACKEND_JWT_SECRET must be set in production to verify JWT signatures.',
  );
}

if (!JWT_SECRET) {
  console.warn(
    '[authenticate] BACKEND_JWT_SECRET not set — running in DECODE-ONLY mode. ' +
    'Set BACKEND_JWT_SECRET to the isms-backend JWT signing secret for production use.',
  );
}

// ── Signature verification ────────────────────────────────────────────────────

/**
 * Verify an HS256 JWT signature using the configured secret.
 * Returns true if the signature is valid, false otherwise.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyHs256Signature(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const signingInput = `${parts[0]}.${parts[1]}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  try {
    const actual = Buffer.from(parts[2]!);
    const exp = Buffer.from(expected);
    // Buffers must be the same length for timingSafeEqual — if not, the sig is wrong.
    if (actual.length !== exp.length) return false;
    return crypto.timingSafeEqual(actual, exp);
  } catch {
    return false;
  }
}

// ── Payload decoding ──────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Verify signature when secret is configured.
    if (JWT_SECRET && !verifyHs256Signature(token, JWT_SECRET)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString('utf8'));

    // Validate expiry if present.
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return {
      id:             payload.sub ?? payload.id ?? '',
      email:          payload.email ?? '',
      role:           payload.role ?? 'VIEWER',
      organizationId: payload.organizationId ?? payload.org_id ?? '',
    };
  } catch {
    return null;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Fastify preHandler: verifies Bearer JWT and attaches request.user.
 * Returns 401 if the token is missing, malformed, expired, or has an invalid signature.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // Let CORS preflight requests pass through without authentication.
  // The browser sends OPTIONS with no Authorization header; blocking it
  // prevents the CORS headers from being returned, breaking all cross-origin calls.
  if (request.method === 'OPTIONS') return;

  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ success: false, error: 'Authentication required' });
    return;
  }
  const token = authHeader.slice(7);
  const user = decodeJwtPayload(token);
  if (!user) {
    reply.code(401).send({ success: false, error: 'Invalid token' });
    return;
  }
  request.user = user;
  const notificationService = getNotificationServiceOrNull();
  if (notificationService) {
    notificationService.ensureDefaultPreferences(user.id, user.organizationId, user.email).catch(() => {});
  }
}

/**
 * Factory: returns a preHandler that requires one of the specified roles.
 * Must be used AFTER `authenticate`.
 *
 * Usage:
 *   preHandler: [authenticate, requireRole('ORG_ADMIN', 'SECURITY_OWNER')]
 */
export function requireRole(...roles: string[]) {
  return async function roleGuard(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      reply.code(401).send({ success: false, error: 'Authentication required' });
      return;
    }
    if (!roles.includes(request.user.role)) {
      reply.code(403).send({
        success: false,
        error: `Insufficient permissions. Required role: ${roles.join(' or ')}`,
        requiredRoles: roles,
        currentRole: request.user.role,
      });
    }
  };
}

/**
 * Tenant isolation guard.
 * Ensures the authenticated user belongs to the same organization as the resource being accessed.
 * Attach to routes that accept an :orgId param.
 */
export async function requireSameOrg(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const params = request.params as Record<string, string>;
  const orgId = params.orgId;
  if (orgId && request.user && request.user.organizationId !== orgId) {
    reply.code(403).send({ success: false, error: 'Access denied: cross-tenant request' });
  }
}
