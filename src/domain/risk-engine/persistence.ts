import type {
  EvidenceSnapshotRecord,
  IntegrationJobExecutionRecord,
  NormalizedSignal,
  ProviderSyncStatusRecord,
  RiskEngineEventRecord,
  RiskEngineRecord,
  RiskRuleRecord,
  ScanRunRecord,
  SignalIngestionRecord,
  TestResultRecord,
} from './types';

export interface SqlExecutor {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

export interface SignalRow {
  id: string;
  organization_id: string;
  integration_id: string;
  provider: string;
  signal_type: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  signal_value_text: string | null;
  signal_value_number: number | null;
  signal_value_boolean: boolean | null;
  metadata_json: Record<string, unknown>;
  observed_at: string;
  collected_at: string;
}

export interface TestResultRow {
  id: string;
  organization_id: string;
  test_id: string;
  signal_id: string;
  status: string;
  severity: string;
  reason: string;
  evidence_snapshot_ids_json: string[];
  executed_at: string;
}

export interface EvidenceSnapshotRow {
  id: string;
  organization_id: string;
  kind: string;
  provider: string;
  integration_id: string;
  resource_id: string;
  control_id: string | null;
  test_id: string | null;
  snapshot_hash: string;
  payload_json: Record<string, unknown>;
  captured_at: string;
}

export interface RiskRuleRow {
  id: string;
  name: string;
  signal_type: string;
  category: string;
  default_likelihood: string;
  severity_weight: number;
  asset_criticality_weight: number;
  duration_weight: number;
}

export interface GeneratedRiskRow {
  id: string;
  organization_id: string;
  dedupe_key: string;
  test_result_id: string;
  rule_id: string;
  title: string;
  category: string;
  severity: string;
  likelihood: string;
  score: number;
  status: string;
  resource_id: string;
  resource_name: string;
  control_ids_json: string[];
  framework_ids_json: string[];
  evidence_snapshot_ids_json: string[];
  owner_team: string;
  created_at: string;
  updated_at: string;
}

export interface RiskEngineEventRow {
  id: string;
  organization_id: string;
  event_type: string;
  provider: string;
  integration_id: string;
  resource_id: string;
  severity: string;
  message: string;
  metadata_json: Record<string, unknown>;
  created_at: string;
}

export interface ProviderSyncStatusRow {
  id: string;
  provider: string;
  integration_id: string;
  status: string;
  last_sync_at: string;
  last_success_at: string;
  signals_collected: number;
  tests_evaluated: number;
  open_risks: number;
}

export interface ScanRunRow {
  id: string;
  provider: string;
  integration_id: string;
  started_at: string;
  completed_at: string;
  status: string;
  signals_ingested: number;
  tests_executed: number;
  risks_generated: number;
  trigger: string;
}

export interface IntegrationJobExecutionRow {
  id: string;
  provider: string;
  integration_id: string;
  organization_id: string;
  job_type: string;
  status: string;
  started_at: string;
  completed_at: string;
  error_message: string | null;
  metadata_json: Record<string, unknown>;
}

export interface SignalIngestionRow {
  id: string;
  signal_id: string;
  provider: string;
  integration_id: string;
  organization_id: string;
  resource_id: string;
  ingested_at: string;
  normalized_at: string;
  job_execution_id: string;
}

function decodeSignalValue(row: SignalRow) {
  if (row.signal_value_boolean !== null) return row.signal_value_boolean;
  if (row.signal_value_number !== null) return row.signal_value_number;
  return row.signal_value_text;
}

export const riskEngineMappers = {
  fromSignalRow(row: SignalRow): NormalizedSignal {
    return {
      id: row.id,
      organizationId: row.organization_id,
      integrationId: row.integration_id,
      provider: row.provider as NormalizedSignal['provider'],
      signalType: row.signal_type as NormalizedSignal['signalType'],
      resourceType: row.resource_type as NormalizedSignal['resourceType'],
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      value: decodeSignalValue(row),
      metadata: row.metadata_json,
      observedAt: row.observed_at,
      collectedAt: row.collected_at,
    };
  },

  toSignalRow(signal: NormalizedSignal): SignalRow {
    return {
      id: signal.id,
      organization_id: signal.organizationId,
      integration_id: signal.integrationId,
      provider: signal.provider,
      signal_type: signal.signalType,
      resource_type: signal.resourceType,
      resource_id: signal.resourceId,
      resource_name: signal.resourceName,
      signal_value_text: typeof signal.value === 'string' ? signal.value : null,
      signal_value_number: typeof signal.value === 'number' ? signal.value : null,
      signal_value_boolean: typeof signal.value === 'boolean' ? signal.value : null,
      metadata_json: signal.metadata,
      observed_at: signal.observedAt,
      collected_at: signal.collectedAt,
    };
  },

  fromTestResultRow(row: TestResultRow): TestResultRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      testId: row.test_id,
      signalId: row.signal_id,
      status: row.status as TestResultRecord['status'],
      severity: row.severity as TestResultRecord['severity'],
      reason: row.reason,
      evidenceSnapshotIds: row.evidence_snapshot_ids_json,
      executedAt: row.executed_at,
    };
  },

  toTestResultRow(result: TestResultRecord): TestResultRow {
    return {
      id: result.id,
      organization_id: result.organizationId,
      test_id: result.testId,
      signal_id: result.signalId,
      status: result.status,
      severity: result.severity,
      reason: result.reason,
      evidence_snapshot_ids_json: result.evidenceSnapshotIds,
      executed_at: result.executedAt,
    };
  },

  fromEvidenceRow(row: EvidenceSnapshotRow): EvidenceSnapshotRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      kind: row.kind as EvidenceSnapshotRecord['kind'],
      provider: row.provider as EvidenceSnapshotRecord['provider'],
      integrationId: row.integration_id,
      resourceId: row.resource_id,
      controlId: row.control_id ?? undefined,
      testId: row.test_id ?? undefined,
      hash: row.snapshot_hash,
      capturedAt: row.captured_at,
      payload: row.payload_json,
    };
  },

  fromRuleRow(row: RiskRuleRow): RiskRuleRecord {
    return {
      id: row.id,
      name: row.name,
      signalType: row.signal_type as RiskRuleRecord['signalType'],
      category: row.category,
      defaultLikelihood: row.default_likelihood as RiskRuleRecord['defaultLikelihood'],
      severityWeight: row.severity_weight,
      assetCriticalityWeight: row.asset_criticality_weight,
      durationWeight: row.duration_weight,
    };
  },

  fromGeneratedRiskRow(row: GeneratedRiskRow): RiskEngineRecord {
    return {
      id: row.id,
      organizationId: row.organization_id,
      dedupeKey: row.dedupe_key,
      testResultId: row.test_result_id,
      ruleId: row.rule_id,
      title: row.title,
      category: row.category,
      severity: row.severity as RiskEngineRecord['severity'],
      likelihood: row.likelihood as RiskEngineRecord['likelihood'],
      score: row.score,
      status: row.status as RiskEngineRecord['status'],
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      controlIds: row.control_ids_json,
      frameworkIds: row.framework_ids_json,
      evidenceSnapshotIds: row.evidence_snapshot_ids_json,
      ownerTeam: row.owner_team,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  fromRiskEngineEventRow(row: RiskEngineEventRow): RiskEngineEventRecord {
    return {
      id: row.id,
      eventType: row.event_type as RiskEngineEventRecord['eventType'],
      provider: row.provider as RiskEngineEventRecord['provider'],
      integrationId: row.integration_id,
      organizationId: row.organization_id,
      resourceId: row.resource_id,
      severity: row.severity as RiskEngineEventRecord['severity'],
      message: row.message,
      createdAt: row.created_at,
      metadata: row.metadata_json,
    };
  },

  toRiskEngineEventRow(event: RiskEngineEventRecord): RiskEngineEventRow {
    return {
      id: event.id,
      organization_id: event.organizationId,
      event_type: event.eventType,
      provider: event.provider,
      integration_id: event.integrationId,
      resource_id: event.resourceId,
      severity: event.severity,
      message: event.message,
      metadata_json: event.metadata,
      created_at: event.createdAt,
    };
  },

  fromProviderSyncStatusRow(row: ProviderSyncStatusRow): ProviderSyncStatusRecord {
    return {
      id: row.id,
      provider: row.provider as ProviderSyncStatusRecord['provider'],
      integrationId: row.integration_id,
      status: row.status as ProviderSyncStatusRecord['status'],
      lastSyncAt: row.last_sync_at,
      lastSuccessAt: row.last_success_at,
      signalsCollected: row.signals_collected,
      testsEvaluated: row.tests_evaluated,
      openRisks: row.open_risks,
    };
  },

  toProviderSyncStatusRow(status: ProviderSyncStatusRecord): ProviderSyncStatusRow {
    return {
      id: status.id,
      provider: status.provider,
      integration_id: status.integrationId,
      status: status.status,
      last_sync_at: status.lastSyncAt,
      last_success_at: status.lastSuccessAt,
      signals_collected: status.signalsCollected,
      tests_evaluated: status.testsEvaluated,
      open_risks: status.openRisks,
    };
  },

  fromScanRunRow(row: ScanRunRow): ScanRunRecord {
    return {
      id: row.id,
      provider: row.provider as ScanRunRecord['provider'],
      integrationId: row.integration_id,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      status: row.status as ScanRunRecord['status'],
      signalsIngested: row.signals_ingested,
      testsExecuted: row.tests_executed,
      risksGenerated: row.risks_generated,
      trigger: row.trigger as ScanRunRecord['trigger'],
    };
  },

  toScanRunRow(run: ScanRunRecord): ScanRunRow {
    return {
      id: run.id,
      provider: run.provider,
      integration_id: run.integrationId,
      started_at: run.startedAt,
      completed_at: run.completedAt,
      status: run.status,
      signals_ingested: run.signalsIngested,
      tests_executed: run.testsExecuted,
      risks_generated: run.risksGenerated,
      trigger: run.trigger,
    };
  },

  fromIntegrationJobExecutionRow(row: IntegrationJobExecutionRow): IntegrationJobExecutionRecord {
    return {
      id: row.id,
      provider: row.provider as IntegrationJobExecutionRecord['provider'],
      integrationId: row.integration_id,
      organizationId: row.organization_id,
      jobType: row.job_type as IntegrationJobExecutionRecord['jobType'],
      status: row.status as IntegrationJobExecutionRecord['status'],
      startedAt: row.started_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message ?? undefined,
      metadata: row.metadata_json,
    };
  },

  toIntegrationJobExecutionRow(execution: IntegrationJobExecutionRecord): IntegrationJobExecutionRow {
    return {
      id: execution.id,
      provider: execution.provider,
      integration_id: execution.integrationId,
      organization_id: execution.organizationId,
      job_type: execution.jobType,
      status: execution.status,
      started_at: execution.startedAt,
      completed_at: execution.completedAt,
      error_message: execution.errorMessage ?? null,
      metadata_json: execution.metadata,
    };
  },

  fromSignalIngestionRow(row: SignalIngestionRow): SignalIngestionRecord {
    return {
      id: row.id,
      signalId: row.signal_id,
      provider: row.provider as SignalIngestionRecord['provider'],
      integrationId: row.integration_id,
      organizationId: row.organization_id,
      resourceId: row.resource_id,
      ingestedAt: row.ingested_at,
      normalizedAt: row.normalized_at,
      jobExecutionId: row.job_execution_id,
    };
  },

  toSignalIngestionRow(record: SignalIngestionRecord): SignalIngestionRow {
    return {
      id: record.id,
      signal_id: record.signalId,
      provider: record.provider,
      integration_id: record.integrationId,
      organization_id: record.organizationId,
      resource_id: record.resourceId,
      ingested_at: record.ingestedAt,
      normalized_at: record.normalizedAt,
      job_execution_id: record.jobExecutionId,
    };
  },
};
