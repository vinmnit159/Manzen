import { apiClient } from './client';

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

export const fleetService = {
  /** Connect a Fleet server via base URL + API token */
  async connect(data: {
    baseUrl: string;
    apiToken: string;
    label?: string;
  }): Promise<{ success: boolean; data: { id: string; baseUrl: string; label: string | null; status: string; adminEmail: string; createdAt: string } }> {
    return apiClient.post('/api/integrations/fleet/connect', data);
  },

  /** List connected Fleet integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: FleetIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/fleet/accounts');
  },

  /** Disconnect a Fleet integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/fleet/${integrationId}`);
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/fleet/${integrationId}/scan`, {});
  },

  /** Get hosts for a Fleet integration */
  async getHosts(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/hosts`);
  },

  /** Get policies for a Fleet integration */
  async getPolicies(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/policies`);
  },

  /** Get findings for a Fleet integration */
  async getFindings(integrationId: string): Promise<{ success: boolean; data: FleetFinding[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/findings`);
  },

  /** Get sync logs for a Fleet integration */
  async getLogs(integrationId: string): Promise<{ success: boolean; data: FleetSyncLog[] }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/logs`);
  },

  /** List automated tests linked to a Fleet integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: Record<string, unknown>[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/fleet/${integrationId}/tests`);
  },
};
