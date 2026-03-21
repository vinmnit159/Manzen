/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';

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

export const cloudflareService = createIntegrationService<
  CloudflareAccountRecord,
  CloudflareFinding,
  any
>('cloudflare', {
  /** Extra: get zones for a Cloudflare account */
  async getZones(accountId: string): Promise<{ success: boolean; data: CloudflareZoneRecord[] }> {
    return apiClient.get(`/api/integrations/cloudflare/${accountId}/zones`);
  },
});
