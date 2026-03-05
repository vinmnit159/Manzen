import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JumpCloudIntegrationRecord {
  id: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface IdentityFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  userEmail: string | null;
  userName: string | null;
  lastLoginAt: string | null;
  status: string;
  createdAt: string;
  syncedAt: string;
}

export interface IdentitySyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const jumpCloudService = {
  async getAccounts(): Promise<{ success: boolean; data: JumpCloudIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/jumpcloud/accounts');
  },

  async connect(data: {
    apiToken: string;
    label?: string;
  }): Promise<{ success: boolean; data: JumpCloudIntegrationRecord }> {
    return apiClient.post('/api/integrations/jumpcloud/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/jumpcloud/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/jumpcloud/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: IdentityFindingRecord[] }> {
    return apiClient.get(`/api/integrations/jumpcloud/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IdentitySyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/jumpcloud/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/jumpcloud/${integrationId}/tests`);
  },
};
