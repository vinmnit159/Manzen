/**
 * Tests for createIntegrationService factory.
 *
 * Strategy: mock apiClient from '@/services/api/client' at the module level,
 * then verify the factory produces services that call the correct endpoints.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module-level mock (hoisted so the factory can resolve at import time) ───

const { mockGet, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn().mockResolvedValue({ success: true, data: [] }),
  mockPost: vi.fn().mockResolvedValue({ success: true }),
  mockDelete: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    delete: mockDelete,
  },
}));

import { createIntegrationService } from '@/services/api/integration-service-factory';

// ── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe('createIntegrationService — endpoint paths', () => {
  it('getAccounts calls GET /api/integrations/{slug}/accounts', async () => {
    const svc = createIntegrationService('okta');
    await svc.getAccounts();
    expect(mockGet).toHaveBeenCalledWith('/api/integrations/okta/accounts');
  });

  it('connect calls POST /api/integrations/{slug}/connect', async () => {
    const svc = createIntegrationService('snyk');
    const payload = { apiKey: 'key-123' };
    await svc.connect(payload);
    expect(mockPost).toHaveBeenCalledWith('/api/integrations/snyk/connect', payload);
  });

  it('disconnect calls DELETE /api/integrations/{slug}/{id}', async () => {
    const svc = createIntegrationService('pagerduty');
    await svc.disconnect('acc-1');
    expect(mockDelete).toHaveBeenCalledWith('/api/integrations/pagerduty/acc-1');
  });

  it('runScan calls POST /api/integrations/{slug}/{id}/scan', async () => {
    const svc = createIntegrationService('aws');
    await svc.runScan('acc-2');
    expect(mockPost).toHaveBeenCalledWith('/api/integrations/aws/acc-2/scan', {});
  });

  it('getFindings calls GET /api/integrations/{slug}/{id}/findings', async () => {
    const svc = createIntegrationService('wiz');
    await svc.getFindings('acc-3');
    expect(mockGet).toHaveBeenCalledWith('/api/integrations/wiz/acc-3/findings');
  });

  it('getLogs calls GET /api/integrations/{slug}/{id}/logs', async () => {
    const svc = createIntegrationService('fleet');
    await svc.getLogs('acc-4');
    expect(mockGet).toHaveBeenCalledWith('/api/integrations/fleet/acc-4/logs');
  });

  it('getTests calls GET /api/integrations/{slug}/{id}/tests', async () => {
    const svc = createIntegrationService('cloudflare');
    await svc.getTests('acc-5');
    expect(mockGet).toHaveBeenCalledWith('/api/integrations/cloudflare/acc-5/tests');
  });
});

describe('createIntegrationService — different slugs', () => {
  it('uses the slug to construct the base path', async () => {
    const svc = createIntegrationService('bamboohr');
    await svc.getAccounts();
    expect(mockGet).toHaveBeenCalledWith('/api/integrations/bamboohr/accounts');
  });
});

describe('createIntegrationService — overrides', () => {
  it('merges custom methods into the service', () => {
    const customSync = vi.fn().mockResolvedValue({ success: true });
    const svc = createIntegrationService('bamboohr', {
      syncEmployees: customSync,
    });

    expect(typeof svc.syncEmployees).toBe('function');
    expect(typeof svc.getAccounts).toBe('function');
  });

  it('override methods are callable', async () => {
    const customSync = vi.fn().mockResolvedValue({ synced: 42 });
    const svc = createIntegrationService('bamboohr', {
      syncEmployees: customSync,
    });

    const result = await svc.syncEmployees('id-1');
    expect(customSync).toHaveBeenCalledWith('id-1');
    expect(result).toEqual({ synced: 42 });
  });

  it('overrides can replace default methods', async () => {
    const customGetAccounts = vi.fn().mockResolvedValue({ custom: true });
    const svc = createIntegrationService('okta', {
      getAccounts: customGetAccounts,
    });

    const result = await svc.getAccounts();
    expect(customGetAccounts).toHaveBeenCalled();
    expect(result).toEqual({ custom: true });
    // The default apiClient.get should NOT have been called
    expect(mockGet).not.toHaveBeenCalled();
  });
});
