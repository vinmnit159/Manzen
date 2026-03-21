import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';
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

export const opsgenieService = createIntegrationService<OpsgenieIntegrationRecord, IncidentRecord, IncidentSyncLog>('opsgenie', {
  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/opsgenie/${integrationId}/incidents`);
  },
});
