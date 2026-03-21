import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FleetIntegrationRecord {
  id: string;
  baseUrl: string;
  label: string | null;
  status: string;
  lastScanAt: string | null;
  createdAt: string;
  hosts: {
    id: string;
    platform: string | null;
    diskEncrypted: boolean | null;
    mdmEnrolled: boolean | null;
    status: string;
    lastSeenAt: string | null;
  }[];
  findings: { id: string; severity: string }[];
}

export interface FleetFinding {
  id: string;
  fleetIntegrationId: string;
  findingKey: string;
  severity: string;
  controlMapped: string | null;
  title: string;
  description: string;
  remediation: string | null;
  affectedCount: number;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FleetSyncLog {
  id: string;
  fleetIntegrationId: string;
  status: string;
  hostsFound: number;
  policiesFound: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const fleetService = createIntegrationService<FleetIntegrationRecord, FleetFinding, FleetSyncLog>('fleet', {
  /** Get hosts for a Fleet integration */
  async getHosts(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/hosts`);
  },
  /** Get policies for a Fleet integration */
  async getPolicies(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/policies`);
  },
});
