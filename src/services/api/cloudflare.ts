import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CloudflareAccountRecord {
  id: string;
  cfAccountId: string;
  label: string | null;
  status: string;
  lastScanAt: string | null;
  createdAt: string;
  zones: CloudflareZoneRecord[];
}

export interface CloudflareZoneRecord {
  id: string;
  zoneName: string;
  status: string;
}

export interface CloudflareFinding {
  id: string;
  cloudflareAccountId: string;
  zoneId: string | null;
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

export const cloudflareService = {
  /** Connect a Cloudflare account via scoped API token */
  async connect(data: {
    apiToken: string;
    label?: string;
  }): Promise<{ success: boolean; data: { id: string; cfAccountId: string; accountName: string; label: string | null; zoneCount: number; status: string; createdAt: string } }> {
    return apiClient.post('/integrations/cloudflare/connect', data);
  },

  /** List connected Cloudflare accounts for the org */
  async getAccounts(): Promise<{ success: boolean; data: CloudflareAccountRecord[] }> {
    return apiClient.get('/integrations/cloudflare/accounts');
  },

  /** Disconnect a Cloudflare account */
  async disconnect(accountId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/cloudflare/${accountId}`);
  },

  /** Trigger a manual scan (fire-and-forget on backend) */
  async runScan(accountId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/cloudflare/${accountId}/scan`, {});
  },

  /** Get findings for a Cloudflare account */
  async getFindings(accountId: string): Promise<{ success: boolean; data: CloudflareFinding[] }> {
    return apiClient.get(`/integrations/cloudflare/${accountId}/findings`);
  },

  /** Get zones for a Cloudflare account */
  async getZones(accountId: string): Promise<{ success: boolean; data: CloudflareZoneRecord[] }> {
    return apiClient.get(`/integrations/cloudflare/${accountId}/zones`);
  },

  /** List automated tests linked to a Cloudflare account */
  async getTests(accountId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/cloudflare/${accountId}/tests`);
  },
};
