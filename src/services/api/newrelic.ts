import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewRelicStatus {
  id: string;
  accountId: number;
  region: 'US' | 'EU';
  connectedAt: string;
  updatedAt: string;
}

export interface NewRelicSyncLog {
  id: string;
  integrationId: string;
  syncType: string;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  message: string | null;
  createdAt: string;
}

export interface NewRelicTest {
  id: string;
  name: string;
  category: string;
  type: string;
  status: string;
  lastResult: string;
  lastRunAt: string | null;
  lastResultDetails: Record<string, unknown>[] | null;
  dueDate: string;
  organizationId: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const newRelicService = {
  /** Get current connection status */
  async getStatus(): Promise<{ connected: boolean; data: NewRelicStatus | null }> {
    return apiClient.get('/integrations/newrelic/status');
  },

  /** Connect New Relic with API key + account ID */
  async connect(data: {
    apiKey: string;
    accountId: string;
    region?: 'US' | 'EU';
  }): Promise<{ success: boolean; data: { id: string; accountId: number; region: string } }> {
    return apiClient.post('/integrations/newrelic/connect', data);
  },

  /** Disconnect New Relic */
  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/newrelic');
  },

  /** Trigger a manual scan (fire-and-forget on backend) */
  async runScan(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/integrations/newrelic/scan', {});
  },

  /** List automated tests linked to NR integration */
  async getTests(): Promise<{ success: boolean; data: NewRelicTest[]; seeded: boolean }> {
    return apiClient.get('/integrations/newrelic/tests');
  },

  /** Get sync log history (last 50) */
  async getLogs(): Promise<{ success: boolean; data: NewRelicSyncLog[] }> {
    return apiClient.get('/integrations/newrelic/logs');
  },
};
