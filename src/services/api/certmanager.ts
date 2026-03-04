import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CertManagerIntegrationRecord {
  id: string;
  instanceUrl: string;
  providerType: string;
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

export const certManagerService = {
  async getAccounts(): Promise<{ success: boolean; data: CertManagerIntegrationRecord[] }> {
    return apiClient.get('/integrations/cert-manager/accounts');
  },

  async connect(data: {
    instanceUrl: string;
    providerType: string;
    apiKey?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    region?: string;
    label?: string;
  }): Promise<{ success: boolean; data: CertManagerIntegrationRecord }> {
    return apiClient.post('/integrations/cert-manager/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/cert-manager/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/cert-manager/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: SecretFindingRecord[] }> {
    return apiClient.get(`/integrations/cert-manager/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: SecretSyncLogRecord[] }> {
    return apiClient.get(`/integrations/cert-manager/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/cert-manager/${integrationId}/tests`);
  },
};
