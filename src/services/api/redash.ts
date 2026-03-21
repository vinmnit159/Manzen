import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';

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

export const redashService = createIntegrationService<RedashIntegrationRecord, RedashFinding, never>('redash', {
  /** Get users for a Redash integration */
  async getUsers(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/redash/${integrationId}/users`);
  },
  /** Get data sources for a Redash integration */
  async getDataSources(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/redash/${integrationId}/data-sources`);
  },
});
