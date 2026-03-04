import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OktaIntegrationRecord {
  id: string;
  domain: string;
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

export const oktaService = {
  async getAccounts(): Promise<{ success: boolean; data: OktaIntegrationRecord[] }> {
    return apiClient.get('/integrations/okta/accounts');
  },

  async connect(data: {
    domain: string;
    apiToken: string;
    label?: string;
  }): Promise<{ success: boolean; data: OktaIntegrationRecord }> {
    return apiClient.post('/integrations/okta/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/okta/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/okta/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: IdentityFindingRecord[] }> {
    return apiClient.get(`/integrations/okta/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IdentitySyncLogRecord[] }> {
    return apiClient.get(`/integrations/okta/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/okta/${integrationId}/tests`);
  },
};
