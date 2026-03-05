import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WizIntegrationRecord {
  id: string;
  label: string | null;
  status: string;
  wizApiEndpoint: string;
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

export const wizService = {
  async getAccounts(): Promise<{ success: boolean; data: WizIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/wiz/accounts');
  },

  async connect(data: {
    clientId: string;
    clientSecret: string;
    wizApiEndpoint?: string;
    label?: string;
  }): Promise<{ success: boolean; data: WizIntegrationRecord }> {
    return apiClient.post('/api/integrations/wiz/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/wiz/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/wiz/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: CloudFindingRecord[] }> {
    return apiClient.get(`/api/integrations/wiz/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: CloudSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/wiz/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/wiz/${integrationId}/tests`);
  },
};
