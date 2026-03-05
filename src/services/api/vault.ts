import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultIntegrationRecord {
  id: string;
  vaultAddr: string;
  namespace: string | null;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface SecretFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  secretPath: string | null;
  expiresAt: string | null;
  rotatedAt: string | null;
  daysSinceRotation: number | null;
  status: string;
  hasRemediation: boolean;
  remediationUrl: string | null;
  createdAt: string;
  syncedAt: string;
}

export interface SecretSyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const vaultService = {
  async getAccounts(): Promise<{ success: boolean; data: VaultIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/vault/accounts');
  },

  async connect(data: {
    vaultAddr: string;
    token: string;
    namespace?: string;
    label?: string;
  }): Promise<{ success: boolean; data: VaultIntegrationRecord }> {
    return apiClient.post('/api/integrations/vault/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/vault/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/vault/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: SecretFindingRecord[] }> {
    return apiClient.get(`/api/integrations/vault/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: SecretSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/vault/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/vault/${integrationId}/tests`);
  },
};
