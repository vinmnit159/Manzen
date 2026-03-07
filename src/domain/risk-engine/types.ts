import { RiskLevel } from '@/services/api/types';

export type SignalProvider =
  | 'aws'
  | 'github'
  | 'google-workspace'
  | 'okta'
  | 'fleet'
  | 'cloudflare'
  | 'snyk'
  | 'system';

export type SignalValue = string | number | boolean | null;

export type NormalizedSignalType =
  | 'CLOUD_STORAGE_PUBLIC_ACCESS'
  | 'IDENTITY_MFA_ENABLED'
  | 'VULNERABILITY_CRITICAL_OPEN'
  | 'DEVICE_DISK_ENCRYPTED'
  | 'SOURCE_CODE_REPO_PRIVATE'
  | 'NETWORK_WAF_ENABLED';

export type ResourceType =
  | 'bucket'
  | 'identity'
  | 'repository'
  | 'device'
  | 'application';

export type ControlTestStatus = 'PASS' | 'FAIL' | 'WARNING' | 'NOT_APPLICABLE' | 'ERROR';

export type EvidenceSnapshotKind = 'signal' | 'test_result' | 'remediation' | 'attestation';

export interface NormalizedSignal {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: SignalProvider;
  signalType: NormalizedSignalType;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  value: SignalValue;
  metadata: Record<string, unknown>;
  observedAt: string;
  collectedAt: string;
}

export interface ControlTestDefinition {
  id: string;
  controlId: string;
  controlName: string;
  version: number;
  signalType: NormalizedSignalType;
  name: string;
  description: string;
  frameworkIds: string[];
  severityOnFail: RiskLevel;
  condition:
    | { operator: 'equals'; expected: SignalValue }
    | { operator: 'not_equals'; expected: SignalValue }
    | { operator: 'greater_than'; expected: number }
    | { operator: 'less_than'; expected: number };
}

export interface TestResultRecord {
  id: string;
  organizationId: string;
  testId: string;
  signalId: string;
  status: ControlTestStatus;
  severity: RiskLevel;
  reason: string;
  executedAt: string;
  evidenceSnapshotIds: string[];
}

export interface EvidenceSnapshotRecord {
  id: string;
  organizationId: string;
  kind: EvidenceSnapshotKind;
  provider: SignalProvider | 'risk-engine';
  integrationId: string;
  resourceId: string;
  controlId?: string;
  testId?: string;
  hash: string;
  capturedAt: string;
  payload: Record<string, unknown>;
}

export interface RiskRuleRecord {
  id: string;
  name: string;
  signalType: NormalizedSignalType;
  category: string;
  defaultLikelihood: RiskLevel;
  severityWeight: number;
  assetCriticalityWeight: number;
  durationWeight: number;
}

export interface RiskEngineRecord {
  id: string;
  organizationId: string;
  dedupeKey: string;
  testResultId: string;
  ruleId: string;
  title: string;
  category: string;
  severity: RiskLevel;
  likelihood: RiskLevel;
  score: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'ACCEPTED' | 'MITIGATED';
  resourceId: string;
  resourceName: string;
  controlIds: string[];
  frameworkIds: string[];
  evidenceSnapshotIds: string[];
  ownerTeam: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskEngineSnapshot {
  signals: number;
  tests: number;
  failingTests: number;
  evidenceSnapshots: number;
  openRisks: number;
}

export interface ProviderSyncStatusRecord {
  id: string;
  provider: SignalProvider;
  integrationId: string;
  status: 'HEALTHY' | 'DEGRADED' | 'ERROR';
  lastSyncAt: string;
  lastSuccessAt: string;
  signalsCollected: number;
  testsEvaluated: number;
  openRisks: number;
}

export interface ScanRunRecord {
  id: string;
  provider: SignalProvider | 'risk-engine';
  integrationId: string;
  startedAt: string;
  completedAt: string;
  status: 'SUCCEEDED' | 'FAILED' | 'RUNNING';
  signalsIngested: number;
  testsExecuted: number;
  risksGenerated: number;
  trigger: 'scheduled' | 'manual' | 'webhook';
}

export interface RiskEngineEventRecord {
  id: string;
  eventType:
    | 'integration.sync.completed'
    | 'signal.ingested'
    | 'signal.normalized'
    | 'test.executed'
    | 'test.failed'
    | 'risk.created'
    | 'risk.updated'
    | 'evidence.created';
  provider: SignalProvider | 'risk-engine';
  integrationId: string;
  organizationId: string;
  resourceId: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface IntegrationJobExecutionRecord {
  id: string;
  provider: SignalProvider | 'risk-engine';
  integrationId: string;
  organizationId: string;
  jobType: 'sync' | 'scan' | 'evaluation';
  status: 'SUCCEEDED' | 'FAILED' | 'RUNNING';
  startedAt: string;
  completedAt: string;
  errorMessage?: string;
  metadata: Record<string, unknown>;
}

export interface SignalIngestionRecord {
  id: string;
  signalId: string;
  provider: SignalProvider;
  integrationId: string;
  organizationId: string;
  resourceId: string;
  ingestedAt: string;
  normalizedAt: string;
  jobExecutionId: string;
}
