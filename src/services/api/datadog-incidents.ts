import { apiClient } from './client';
import type { IncidentRecord, IncidentSyncLog } from './pagerduty';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DatadogIntegrationRecord {
  id: string;
  datadogSite: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  slaHours: number;
  staleDays: number;
  createdAt: string;
  incidentCount: number;
}

export type { IncidentRecord, IncidentSyncLog };

// ─── Service ──────────────────────────────────────────────────────────────────

export const datadogIncidentsService = {
  async getAccounts(): Promise<{ success: boolean; data: DatadogIntegrationRecord[] }> {
    return apiClient.get('/integrations/datadog-incidents/accounts');
  },

  async connect(data: {
    apiKey: string;
    appKey: string;
    datadogSite?: string;
    label?: string;
    slaHours?: number;
    staleDays?: number;
  }): Promise<{ success: boolean; data: DatadogIntegrationRecord }> {
    return apiClient.post('/integrations/datadog-incidents/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/datadog-incidents/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/datadog-incidents/${integrationId}/scan`, {});
  },

  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/integrations/datadog-incidents/${integrationId}/incidents`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IncidentSyncLog[] }> {
    return apiClient.get(`/integrations/datadog-incidents/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/datadog-incidents/${integrationId}/tests`);
  },
};
