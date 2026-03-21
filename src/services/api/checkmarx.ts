/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CheckmarxIntegrationRecord {
  id: string;
  instanceUrl: string;
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

export const checkmarxService = {
  async getAccounts(): Promise<{ success: boolean; data: CheckmarxIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/checkmarx/accounts');
  },

  async connect(data: {
    instanceUrl: string;
    clientId: string;
    clientSecret: string;
    label?: string;
  }): Promise<{ success: boolean; data: CheckmarxIntegrationRecord }> {
    return apiClient.post('/api/integrations/checkmarx/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/checkmarx/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/checkmarx/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: CodeFindingRecord[] }> {
    return apiClient.get(`/api/integrations/checkmarx/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: CodeSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/checkmarx/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/checkmarx/${integrationId}/tests`);
  },
};
