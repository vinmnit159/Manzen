/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';
import { createIntegrationService } from './integration-service-factory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BigIdIntegrationRecord {
  id: string;
  baseUrl: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  staleScanDays: number;
  createdAt: string;
  dataSourceCount: number;
  latestSummary: {
    piiCount: number;
    pciCount: number;
    phiCount: number;
    secretsCount: number;
    totalSensitiveRecords: number;
    dataSourceCount: number;
    scannedCount: number;
    staleCount: number;
    noOwnerCount: number;
    snapshotAt: string;
  } | null;
}

export interface BigIdSyncLog {
  id: string;
  bigIdIntegrationId: string;
  status: string;
  dataSourcesFound: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const bigIdService = createIntegrationService<BigIdIntegrationRecord, any, BigIdSyncLog>('bigid', {
  /** List data sources for an integration */
  async getDataSources(
    integrationId: string,
    filter?: 'stale' | 'no-owner' | 'sensitive',
  ): Promise<{ success: boolean; data: any[] }> {
    const qs = filter ? `?filter=${filter}` : '';
    return apiClient.get(`/api/integrations/bigid/${integrationId}/data-sources${qs}`);
  },
});
