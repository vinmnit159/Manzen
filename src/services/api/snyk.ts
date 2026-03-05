import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SnykIntegrationRecord {
  id: string;
  snykOrgId: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface CodeFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  filePath: string | null;
  packageName: string | null;
  cveId: string | null;
  status: string;
  hasRemediation: boolean;
  remediationUrl: string | null;
  createdAt: string;
  syncedAt: string;
}

export interface CodeSyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const snykService = {
  async getAccounts(): Promise<{ success: boolean; data: SnykIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/snyk/accounts');
  },

  async connect(data: {
    snykOrgId: string;
    apiToken: string;
    label?: string;
  }): Promise<{ success: boolean; data: SnykIntegrationRecord }> {
    return apiClient.post('/api/integrations/snyk/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/snyk/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/snyk/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: CodeFindingRecord[] }> {
    return apiClient.get(`/api/integrations/snyk/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: CodeSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/snyk/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/snyk/${integrationId}/tests`);
  },
};
