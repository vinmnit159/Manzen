/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AzureAdIntegrationRecord {
  id: string;
  tenantId: string;
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

export const azureAdService = {
  async getAccounts(): Promise<{ success: boolean; data: AzureAdIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/azure-ad/accounts');
  },

  async connect(data: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    label?: string;
  }): Promise<{ success: boolean; data: AzureAdIntegrationRecord }> {
    return apiClient.post('/api/integrations/azure-ad/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/azure-ad/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/azure-ad/${integrationId}/scan`, {});
  },

  async getFindings(integrationId: string): Promise<{ success: boolean; data: IdentityFindingRecord[] }> {
    return apiClient.get(`/api/integrations/azure-ad/${integrationId}/findings`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IdentitySyncLogRecord[] }> {
    return apiClient.get(`/api/integrations/azure-ad/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/azure-ad/${integrationId}/tests`);
  },
};
