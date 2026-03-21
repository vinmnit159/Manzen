/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';
import type { IncidentRecord, IncidentSyncLog } from './pagerduty';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceNowIntegrationRecord {
  id: string;
  instanceUrl: string;
  label: string | null;
  authMethod: string;
  status: string;
  lastSyncAt: string | null;
  slaHours: number;
  staleDays: number;
  createdAt: string;
  incidentCount: number;
}

export type { IncidentRecord, IncidentSyncLog };

// ─── Service ──────────────────────────────────────────────────────────────────

export const servicenowIncidentService = {
  async getAccounts(): Promise<{ success: boolean; data: ServiceNowIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/servicenow-incident/accounts');
  },

  async connect(data: {
    instanceUrl: string;
    username?: string;
    password?: string;
    token?: string;
    authMethod?: string;
    label?: string;
    slaHours?: number;
    staleDays?: number;
  }): Promise<{ success: boolean; data: ServiceNowIntegrationRecord }> {
    return apiClient.post('/api/integrations/servicenow-incident/connect', data);
  },

  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/servicenow-incident/${integrationId}`);
  },

  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/servicenow-incident/${integrationId}/scan`, {});
  },

  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/servicenow-incident/${integrationId}/incidents`);
  },

  async getLogs(integrationId: string): Promise<{ success: boolean; data: IncidentSyncLog[] }> {
    return apiClient.get(`/api/integrations/servicenow-incident/${integrationId}/logs`);
  },

  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/servicenow-incident/${integrationId}/tests`);
  },
};
