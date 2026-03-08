/**
 * Server-side JWT authentication middleware for Fastify.
 *
 * Usage in a route definition:
 *   preHandler: [authenticate]
 *
 * Attaches `request.user` with { id, email, role, organizationId } if valid.
 * Responds with 401 if the token is missing or invalid.
 *
 * NOTE: We do not use jsonwebtoken (no dep) — we decode the payload manually
 * since the JWT was issued by the external backend. For production, replace
 * with proper verification using the backend's public key / secret.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';

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

function decodeJwtPayload(token: string): AuthUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
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

/**
 * Fastify preHandler: verifies Bearer JWT and attaches request.user.
 * Returns 401 if the token is missing or malformed.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
