import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';
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

export const servicenowIncidentService = createIntegrationService<ServiceNowIntegrationRecord, IncidentRecord, IncidentSyncLog>('servicenow-incident', {
  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/servicenow-incident/${integrationId}/incidents`);
  },
});
