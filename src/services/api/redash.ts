import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RedashIntegrationRecord {
  id: string;
  baseUrl: string;
  label: string | null;
  status: string;
  lastScanAt: string | null;
  createdAt: string;
  users: { id: string; isActive: boolean }[];
  dataSources: { id: string }[];
}

export interface RedashFinding {
  id: string;
  redashIntegrationId: string;
  findingKey: string;
  severity: string;
  controlMapped: string | null;
  title: string;
  description: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const redashService = {
  /** Connect a Redash instance via base URL + API key */
  async connect(data: {
    baseUrl: string;
    apiKey: string;
    label?: string;
  }): Promise<{ success: boolean; data: { id: string; baseUrl: string; label: string | null; status: string; adminEmail: string; createdAt: string } }> {
    return apiClient.post('/integrations/redash/connect', data);
  },

  /** List connected Redash integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: RedashIntegrationRecord[] }> {
    return apiClient.get('/integrations/redash/accounts');
  },

  /** Disconnect a Redash integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/redash/${integrationId}`);
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/redash/${integrationId}/scan`, {});
  },

  /** Get findings for a Redash integration */
  async getFindings(integrationId: string): Promise<{ success: boolean; data: RedashFinding[] }> {
    return apiClient.get(`/integrations/redash/${integrationId}/findings`);
  },

  /** Get users for a Redash integration */
  async getUsers(integrationId: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/integrations/redash/${integrationId}/users`);
  },

  /** Get data sources for a Redash integration */
  async getDataSources(integrationId: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/integrations/redash/${integrationId}/data-sources`);
  },

  /** List automated tests linked to a Redash integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/redash/${integrationId}/tests`);
  },
};
