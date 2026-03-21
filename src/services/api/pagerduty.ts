import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';

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

export const pagerdutyService = createIntegrationService<
  PagerDutyIntegrationRecord,
  IncidentRecord,
  IncidentSyncLog
>('pagerduty', {
  /** PagerDuty uses /incidents instead of /findings */
  async getIncidents(integrationId: string): Promise<{ success: boolean; data: IncidentRecord[] }> {
    return apiClient.get(`/api/integrations/pagerduty/${integrationId}/incidents`);
  },
});
