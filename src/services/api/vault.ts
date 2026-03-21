import { createIntegrationService } from './integration-service-factory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VaultIntegrationRecord {
  id: string;
  vaultAddr: string;
  namespace: string | null;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface SecretFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  secretPath: string | null;
  expiresAt: string | null;
  rotatedAt: string | null;
  daysSinceRotation: number | null;
  status: string;
  hasRemediation: boolean;
  remediationUrl: string | null;
  createdAt: string;
  syncedAt: string;
}

export interface SecretSyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const vaultService = createIntegrationService<VaultIntegrationRecord, SecretFindingRecord, SecretSyncLogRecord>('vault');
