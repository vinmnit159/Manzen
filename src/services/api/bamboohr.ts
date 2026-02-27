import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HRIntegrationRecord {
  id: string;
  subdomain: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  personnel: { id: string; status: string }[];
}

export interface PersonnelRecord {
  id: string;
  hrIntegrationId: string;
  hrEmployeeId: string;
  email: string | null;
  firstName: string;
  lastName: string;
  department: string | null;
  jobTitle: string | null;
  managerEmail: string | null;
  location: string | null;
  status: string; // ACTIVE | TERMINATED
  hireDate: string | null;
  terminationDate: string | null;
  isMappedToUser: boolean;
  createdAt: string;
  updatedAt: string;
  offboarding: {
    id: string;
    status: string;
    accessRevokedDate: string | null;
    mdmUninstalled: boolean;
    accountsDeprovisioned: boolean;
  } | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const bamboohrService = {
  /** Connect a BambooHR account via subdomain + API key */
  async connect(data: {
    subdomain: string;
    apiKey: string;
    label?: string;
  }): Promise<{ success: boolean; data: { id: string; subdomain: string; label: string | null; status: string; employeeCount: number; companyName: string; createdAt: string } }> {
    return apiClient.post('/integrations/bamboohr/connect', data);
  },

  /** List connected BambooHR integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: HRIntegrationRecord[] }> {
    return apiClient.get('/integrations/bamboohr/accounts');
  },

  /** Disconnect a BambooHR integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/bamboohr/${integrationId}`);
  },

  /** Trigger a manual employee sync (fire-and-forget) */
  async syncEmployees(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/bamboohr/${integrationId}/sync`, {});
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/bamboohr/${integrationId}/scan`, {});
  },

  /** Get personnel roster for a BambooHR integration */
  async getPersonnel(integrationId: string): Promise<{ success: boolean; data: PersonnelRecord[] }> {
    return apiClient.get(`/integrations/bamboohr/${integrationId}/personnel`);
  },

  /** List automated tests linked to a BambooHR integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/bamboohr/${integrationId}/tests`);
  },
};
