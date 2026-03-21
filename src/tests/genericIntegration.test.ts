/**
 * Tests for src/server/integrations/genericIntegrationModule.ts
 *
 * Focus areas:
 *   1. Tenant isolation — organizationId is always sourced from request.user,
 *      never from the request body (cross-tenant injection protection).
 *   2. Missing user context → structured error response.
 *   3. Body containing a different organizationId is ignored.
 *
 * Strategy: call registerGenericIntegrationModules() with a fake registrar that
 * captures the registered route handlers, then call those handlers directly.
 * All external I/O (risk engine, DB) is mocked at the module level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module-level mocks (must be hoisted before the import under test) ─────────

vi.mock('@/server/risk-engine/runtime', () => ({
  getRiskEngineRuntimeService: vi.fn(),
}));

vi.mock('@/server/integrations/providerAdapters', () => ({
  getIntegrationProviderAdapter: vi.fn(),
}));

// ── Imports after mocks are established ──────────────────────────────────────

import { registerGenericIntegrationModules } from '@/server/integrations/genericIntegrationModule';
import { getRiskEngineRuntimeService } from '@/server/risk-engine/runtime';
import { getIntegrationProviderAdapter } from '@/server/integrations/providerAdapters';

// ── Test fixture helpers ──────────────────────────────────────────────────────

type RouteHandler = (request?: {
  body?: unknown;
  params?: Record<string, string>;
  user?: { id: string; organizationId: string; role: string };
}) => Promise<unknown>;

/**
 * Register all generic integration routes and return a map from URL → handler.
 */
function collectHandlers(): Map<string, RouteHandler> {
  const handlers = new Map<string, RouteHandler>();
  registerGenericIntegrationModules({
    route(definition) {
      handlers.set(definition.url, definition.handler as RouteHandler);
    },
  });
  return handlers;
}

/** Return the handler for the okta scan route (representative of all routes). */
function getOktaHandler(): RouteHandler {
  const handlers = collectHandlers();
  const handler = handlers.get('/api/integrations/okta/:integrationId/scan');
  if (!handler) throw new Error('okta handler not found');
  return handler;
}

/** A minimal provider adapter mock that returns a fixed set of signals. */
function makeAdapterMock(signalCount = 1) {
  return {
    provider: 'okta' as const,
    routeKey: 'okta',
    buildSignals: vi.fn().mockReturnValue(
      Array.from({ length: signalCount }, (_, i) => ({ id: `sig-${i}` })),
    ),
  };
}

/** A minimal risk engine service mock. */
function makeRuntimeMock() {
  return {
    ingestNormalizedSignals: vi.fn().mockResolvedValue({
      testResults: [{ id: 'tr-1' }],
      risks: [],
    }),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('registerGenericIntegrationModules — tenant isolation', () => {
  it('uses request.user.organizationId when user is present, ignoring any body.organizationId', async () => {
    const adapter = makeAdapterMock();
    const runtime = makeRuntimeMock();

    vi.mocked(getIntegrationProviderAdapter).mockReturnValue(adapter as never);
    vi.mocked(getRiskEngineRuntimeService).mockResolvedValue(runtime as never);

    const handler = getOktaHandler();
    const result = await handler({
      body: { organizationId: 'attacker-org', records: [] },
      params: { integrationId: 'int-okta-1' },
      user: { id: 'user-1', organizationId: 'real-org', role: 'VIEWER' },
    }) as { success: boolean };

    expect(result.success).toBe(true);

    // The adapter was called with the user's org, not the body's org.
    const [buildArgs] = adapter.buildSignals.mock.calls[0]!;
    expect((buildArgs as { organizationId: string }).organizationId).toBe('real-org');

    // The execution record passed to ingestNormalizedSignals also uses real-org.
    const [ingestArgs] = runtime.ingestNormalizedSignals.mock.calls[0]!;
    expect((ingestArgs as { execution: { organizationId: string } }).execution.organizationId).toBe('real-org');
  });

  it('ignores body.organizationId and never lets a different tenant org reach the risk engine', async () => {
    const adapter = makeAdapterMock();
    const runtime = makeRuntimeMock();

    vi.mocked(getIntegrationProviderAdapter).mockReturnValue(adapter as never);
    vi.mocked(getRiskEngineRuntimeService).mockResolvedValue(runtime as never);

    const handler = getOktaHandler();
    await handler({
      body: { organizationId: 'other-tenant-org' },
      params: { integrationId: 'int-okta-2' },
      user: { id: 'user-2', organizationId: 'correct-org', role: 'ORG_ADMIN' },
    });

    const [buildArgs] = adapter.buildSignals.mock.calls[0]!;
    expect((buildArgs as { organizationId: string }).organizationId).not.toBe('other-tenant-org');
    expect((buildArgs as { organizationId: string }).organizationId).toBe('correct-org');
  });
});

describe('registerGenericIntegrationModules — missing user context', () => {
  it('returns an error when request.user is undefined', async () => {
    const handler = getOktaHandler();
    const result = await handler({
      body: {},
      params: { integrationId: 'int-okta-3' },
      // no user
    }) as { success: boolean; error: string };

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing organization context/i);
  });

  it('returns an error when the entire request object is undefined', async () => {
    const handler = getOktaHandler();
    const result = await handler(undefined) as { success: boolean; error: string };

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/missing organization context/i);
  });

  it('does not call the risk engine when user context is absent', async () => {
    const runtime = makeRuntimeMock();
    vi.mocked(getRiskEngineRuntimeService).mockResolvedValue(runtime as never);

    const handler = getOktaHandler();
    await handler({ body: {}, params: {} });

    expect(runtime.ingestNormalizedSignals).not.toHaveBeenCalled();
  });
});

describe('registerGenericIntegrationModules — successful ingestion', () => {
  it('returns signal count, test results count, and risk count on success', async () => {
    const adapter = makeAdapterMock(3);
    const runtime = makeRuntimeMock();
    // Override to return 2 test results and 1 risk.
    runtime.ingestNormalizedSignals.mockResolvedValue({
      testResults: [{ id: 'tr-1' }, { id: 'tr-2' }],
      risks: [{ id: 'risk-1' }],
    });

    vi.mocked(getIntegrationProviderAdapter).mockReturnValue(adapter as never);
    vi.mocked(getRiskEngineRuntimeService).mockResolvedValue(runtime as never);

    const handler = getOktaHandler();
    const result = await handler({
      body: { records: [{ id: 'u1' }, { id: 'u2' }, { id: 'u3' }] },
      params: { integrationId: 'int-okta-4' },
      user: { id: 'user-5', organizationId: 'org-success', role: 'VIEWER' },
    }) as { success: boolean; data: { signals: number; testResults: number; risks: number } };

    expect(result.success).toBe(true);
    expect(result.data.signals).toBe(3);
    expect(result.data.testResults).toBe(2);
    expect(result.data.risks).toBe(1);
  });

  it('registers routes for all supported providers', () => {
    const handlers = collectHandlers();
    const expectedProviders = ['aws', 'azure', 'cloudflare', 'fleet', 'okta', 'snyk', 'workspace'];

    for (const provider of expectedProviders) {
      const url = `/api/integrations/${provider}/:integrationId/scan`;
      expect(handlers.has(url), `Missing route for provider: ${provider}`).toBe(true);
    }
  });

  it('uses the integrationId from params rather than a fallback when params are present', async () => {
    const adapter = makeAdapterMock();
    const runtime = makeRuntimeMock();

    vi.mocked(getIntegrationProviderAdapter).mockReturnValue(adapter as never);
    vi.mocked(getRiskEngineRuntimeService).mockResolvedValue(runtime as never);

    const handler = getOktaHandler();
    await handler({
      body: {},
      params: { integrationId: 'my-custom-integration-id' },
      user: { id: 'user-6', organizationId: 'org-6', role: 'VIEWER' },
    });

    const [buildArgs] = adapter.buildSignals.mock.calls[0]!;
    expect((buildArgs as { integrationId: string }).integrationId).toBe('my-custom-integration-id');
  });
});
