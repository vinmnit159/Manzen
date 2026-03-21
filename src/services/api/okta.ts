import { createIntegrationService } from './integration-service-factory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OktaIntegrationRecord {
  id: string;
  domain: string;
  label: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  findingCount: number;
}

export interface IdentityFindingRecord {
  id: string;
  provider: string;
  externalId: string;
  title: string;
  severity: string;
  category: string | null;
  userEmail: string | null;
  userName: string | null;
  lastLoginAt: string | null;
  status: string;
  createdAt: string;
  syncedAt: string;
}

export interface IdentitySyncLogRecord {
  id: string;
  provider: string;
  status: string;
  findingsFound: number;
  criticalCount: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const oktaService = createIntegrationService<
  OktaIntegrationRecord,
  IdentityFindingRecord,
  IdentitySyncLogRecord
>('okta');
