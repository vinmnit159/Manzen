/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecretsManagerIntegrationRecord {
  id: string;
  awsRegion: string;
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

export const secretsManagerService = {
  async getAccounts(): Promise<{ success: boolean; data: SecretsManagerIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/secrets-manager/accounts');
  },

  async connect(data: {
    awsRegion: string;
    accessKeyId: string;
    secretAccessKey: string;
    label?: string;
  }): Promise<{ success: boolean; data: SecretsManagerIntegrationRecord }> {
    return apiClient.post('/api/integrations/secrets-manager/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/secrets-manager/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/secrets-manager/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: SecretFindingRecord[] }> {
    return apiClient.get(`/api/integrations/secrets-manager/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: SecretSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/secrets-manager/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/secrets-manager/${integrationId}/tests`);
  },
};
