import { createIntegrationService } from './integration-service-factory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VeracodeIntegrationRecord {
  id: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface CodeFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  filePath: string | null;
  packageName: string | null;
  cveId: string | null;
  status: string;
  hasRemediation: boolean;
  remediationUrl: string | null;
  createdAt: string;
  syncedAt: string;
}

export interface CodeSyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const veracodeService = createIntegrationService<VeracodeIntegrationRecord, CodeFindingRecord, CodeSyncLogRecord>('veracode');
