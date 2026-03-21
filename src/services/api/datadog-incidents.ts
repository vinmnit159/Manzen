import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';
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

export const datadogIncidentsService = createIntegrationService<DatadogIntegrationRecord, IncidentRecord, IncidentSyncLog>('datadog-incidents', {
  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/datadog-incidents/${integrationId}/incidents`);
  },
});
