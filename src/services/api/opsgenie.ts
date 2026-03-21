/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';
import type { IncidentRecord, IncidentSyncLog } from './pagerduty';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OpsgenieIntegrationRecord {
  id: string;
  label: string | null;
  region: string;
  status: string;
  lastSyncAt: string | null;
  slaHours: number;
  staleDays: number;
  createdAt: string;
  incidentCount: number;
}

export type { IncidentRecord, IncidentSyncLog };

// ─── Service ──────────────────────────────────────────────────────────────────

export const opsgenieService = {
  async getAccounts(): Promise<{ success: boolean; data: OpsgenieIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/opsgenie/accounts');
  },

  async connect(data: {
    apiKey: string;
    region?: string;
    label?: string;
    slaHours?: number;
    staleDays?: number;
  }): Promise<{ success: boolean; data: OpsgenieIntegrationRecord }> {
    return apiClient.post('/api/integrations/opsgenie/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/opsgenie/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/opsgenie/${integrationId}/scan`, {});
  },

  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/opsgenie/${integrationId}/incidents`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IncidentSyncLog[] }> {
    return apiClient.get(`/api/integrations/opsgenie/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/opsgenie/${integrationId}/tests`);
  },
};
