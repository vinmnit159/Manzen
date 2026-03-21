/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagerDutyIntegrationRecord {
  id: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  slaHours: number;
  staleDays: number;
  createdAt: string;
  incidentCount: number;
}

export interface IncidentRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  normalizedSeverity: string;
  status: string;
  normalizedStatus: string;
  assignedTo: string | null;
  serviceOrTeam: string | null;
  createdAt: string;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  durationMinutes: number | null;
  breachedSla: boolean;
  hasRca: boolean;
  syncedAt: string;
}

export interface IncidentSyncLog {
  id: string;
  provider: string;
  status: string;
  incidentsFound: number;
  breachedSlaCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const pagerdutyService = {
  async getAccounts(): Promise<{ success: boolean; data: PagerDutyIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/pagerduty/accounts');
  },

  async connect(data: {
    apiKey: string;
    label?: string;
    slaHours?: number;
    staleDays?: number;
  }): Promise<{ success: boolean; data: PagerDutyIntegrationRecord }> {
    return apiClient.post('/api/integrations/pagerduty/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/pagerduty/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/pagerduty/${integrationId}/scan`, {});
  },

  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/pagerduty/${integrationId}/incidents`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IncidentSyncLog[] }> {
    return apiClient.get(`/api/integrations/pagerduty/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/pagerduty/${integrationId}/tests`);
  },
};
