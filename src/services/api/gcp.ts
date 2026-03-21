/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GcpIntegrationRecord {
  id: string;
  projectId: string;
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

export const gcpService = {
  async getAccounts(): Promise<{ success: boolean; data: GcpIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/gcp/accounts');
  },

  async connect(data: {
    keyJson: string;
    label?: string;
  }): Promise<{ success: boolean; data: GcpIntegrationRecord }> {
    return apiClient.post('/api/integrations/gcp/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/gcp/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/gcp/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: CloudFindingRecord[] }> {
    return apiClient.get(`/api/integrations/gcp/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: CloudSyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/gcp/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/gcp/${integrationId}/tests`);
  },
};
