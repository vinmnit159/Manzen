import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BigIdIntegrationRecord {
  id: string;
  baseUrl: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  staleScanDays: number;
  createdAt: string;
  dataSourceCount: number;
  latestSummary: {
    piiCount: number;
    pciCount: number;
    phiCount: number;
    secretsCount: number;
    totalSensitiveRecords: number;
    dataSourceCount: number;
    scannedCount: number;
    staleCount: number;
    noOwnerCount: number;
    snapshotAt: string;
  } | null;
}

export interface BigIdSyncLog {
  id: string;
  bigIdIntegrationId: string;
  status: string;
  dataSourcesFound: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const bigIdService = {
  /** List connected BigID integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: BigIdIntegrationRecord[] }> {
    return apiClient.get('/integrations/bigid/accounts');
  },

  /** Connect a new BigID instance (base URL + API token) */
  async connect(data: {
    baseUrl: string;
    apiToken: string;
    label?: string;
    staleScanDays?: number;
    criticalScanDays?: number;
  }): Promise<{ success: boolean; data: BigIdIntegrationRecord }> {
    return apiClient.post('/integrations/bigid/connect', data);
  },

  /** Disconnect a BigID integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/bigid/${integrationId}`);
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/bigid/${integrationId}/scan`, {});
  },

  /** List data sources for an integration */
  async getDataSources(
    integrationId: string,
    filter?: 'stale' | 'no-owner' | 'sensitive',
  ): Promise<{ success: boolean; data: any[] }> {
    const qs = filter ? `?filter=${filter}` : '';
    return apiClient.get(`/integrations/bigid/${integrationId}/data-sources${qs}`);
  },

  /** Get latest findings summary snapshots */
  async getFindings(integrationId: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/integrations/bigid/${integrationId}/findings`);
  },

  /** Get sync logs */
  async getLogs(integrationId: string): Promise<{ success: boolean; data: BigIdSyncLog[] }> {
    return apiClient.get(`/integrations/bigid/${integrationId}/logs`);
  },

  /** List automated tests linked to this integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/bigid/${integrationId}/tests`);
  },
};
