import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkspaceIntegrationRecord {
  id: string;
  domain: string;
  adminEmail: string;
  label: string | null;
  status: string;
  lastScanAt: string | null;
  createdAt: string;
  users: { id: string; isSuspended: boolean; isAdmin: boolean; mfaEnabled: boolean }[];
  findings: { id: string; severity: string }[];
}

export interface WorkspaceFinding {
  id: string;
  workspaceIntegrationId: string;
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

export const workspaceService = {
  /** Connect a Google Workspace domain via service account JSON + admin email */
  async connect(data: {
    serviceAccountJson: string;
    adminEmail: string;
    label?: string;
  }): Promise<{
    success: boolean;
    data: {
      id: string;
      domain: string;
      adminEmail: string;
      label: string | null;
      status: string;
      userCount: number;
      createdAt: string;
    };
  }> {
    return apiClient.post('/api/integrations/workspace/connect', data);
  },

  /** List connected Google Workspace integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: WorkspaceIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/workspace/accounts');
  },

  /** Disconnect a Google Workspace integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/workspace/${integrationId}`);
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/workspace/${integrationId}/scan`, {});
  },

  /** Get users for a workspace integration */
  async getUsers(integrationId: string): Promise<{ success: boolean; data: any[] }> {
    return apiClient.get(`/api/integrations/workspace/${integrationId}/users`);
  },

  /** Get findings for a workspace integration */
  async getFindings(integrationId: string): Promise<{ success: boolean; data: WorkspaceFinding[] }> {
    return apiClient.get(`/api/integrations/workspace/${integrationId}/findings`);
  },

  /** List automated tests linked to a workspace integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/workspace/${integrationId}/tests`);
  },
};
