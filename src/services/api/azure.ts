import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AzureIntegrationRecord {
  id: string;
  subscriptionId: string;
  tenantId: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface CloudFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  resource: string | null;
  resourceType: string | null;
  status: string;
  hasRemediation: boolean;
  remediationUrl: string | null;
  createdAt: string;
  syncedAt: string;
}

export interface CloudSyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const azureService = {
  async getAccounts(): Promise<{ success: boolean; data: AzureIntegrationRecord[] }> {
    return apiClient.get('/integrations/azure/accounts');
  },

  async connect(data: {
    subscriptionId: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    label?: string;
  }): Promise<{ success: boolean; data: AzureIntegrationRecord }> {
    return apiClient.post('/integrations/azure/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/azure/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/azure/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: CloudFindingRecord[] }> {
    return apiClient.get(`/integrations/azure/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: CloudSyncLogRecord[] }> {
    return apiClient.get(`/integrations/azure/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/azure/${integrationId}/tests`);
  },
};
