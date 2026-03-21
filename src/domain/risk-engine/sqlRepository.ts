import {
  riskEngineMappers,
  type SqlExecutor,
  type SignalRow,
  type TestResultRow,
  type EvidenceSnapshotRow,
  type RiskRuleRow,
  type GeneratedRiskRow,
  type RiskEngineEventRow,
  type ProviderSyncStatusRow,
  type ScanRunRow,
  type IntegrationJobExecutionRow,
  type SignalIngestionRow,
} from './persistence';
import type { RiskEngineRepository } from './repository';
import type {
  ControlTestDefinition,
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

interface ControlTestVersionRow {
  id: string;
  control_id: string;
  name: string;
  version: number;
  signal_type: string;
  description: string;
  framework_ids_json: string[];
  severity_on_fail: string;
  condition_json: Record<string, unknown>;
}

export class SqlRiskEngineRepository implements RiskEngineRepository {
  constructor(private readonly db: SqlExecutor) {}

  async listSignals(): Promise<NormalizedSignal[]> {
    const result = await this.db.query<SignalRow>('select * from signals_normalized order by collected_at desc');
    return result.rows.map((row) => riskEngineMappers.fromSignalRow(row));
  }

  async saveSignals(signals: NormalizedSignal[]): Promise<void> {
    for (const signal of signals) {
      const row = riskEngineMappers.toSignalRow(signal);
      await this.db.query(
        'insert into signals_normalized (id, organization_id, integration_id, provider, signal_type, resource_type, resource_id, resource_name, signal_value_text, signal_value_number, signal_value_boolean, metadata_json, observed_at, collected_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict (id) do update set signal_value_text = excluded.signal_value_text, signal_value_number = excluded.signal_value_number, signal_value_boolean = excluded.signal_value_boolean, metadata_json = excluded.metadata_json, observed_at = excluded.observed_at, collected_at = excluded.collected_at',
        [row.id, row.organization_id, row.integration_id, row.provider, row.signal_type, row.resource_type, row.resource_id, row.resource_name, row.signal_value_text, row.signal_value_number, row.signal_value_boolean, JSON.stringify(row.metadata_json), row.observed_at, row.collected_at],
      );
    }
  }

  async listTests(): Promise<ControlTestDefinition[]> {
    const result = await this.db.query<ControlTestVersionRow>('select * from control_test_versions order by created_at desc');
    return result.rows.map((row) => ({
      id: row.id,
      controlId: row.control_id,
      controlName: row.name,
      version: row.version,
      signalType: row.signal_type as ControlTestDefinition['signalType'],
      name: row.name,
      description: row.description,
      frameworkIds: row.framework_ids_json,
      severityOnFail: row.severity_on_fail as ControlTestDefinition['severityOnFail'],
      condition: row.condition_json as ControlTestDefinition['condition'],
    }));
  }

  async listRules(): Promise<RiskRuleRecord[]> {
    const result = await this.db.query<RiskRuleRow>('select * from risk_rules order by created_at desc');
    return result.rows.map((row) => riskEngineMappers.fromRuleRow(row));
  }

  async listEvidence(): Promise<EvidenceSnapshotRecord[]> {
    const result = await this.db.query<EvidenceSnapshotRow>('select * from evidence_snapshots order by captured_at desc');
    return result.rows.map((row) => riskEngineMappers.fromEvidenceRow(row));
  }

  async listIntegrationExecutions(): Promise<IntegrationJobExecutionRecord[]> {
    const result = await this.db.query<IntegrationJobExecutionRow>('select * from integration_job_executions order by completed_at desc');
    return result.rows.map((row) => riskEngineMappers.fromIntegrationJobExecutionRow(row));
  }

  async saveIntegrationExecutions(executions: IntegrationJobExecutionRecord[]): Promise<void> {
    for (const execution of executions) {
      const row = riskEngineMappers.toIntegrationJobExecutionRow(execution);
      await this.db.query(
        'insert into integration_job_executions (id, provider, integration_id, organization_id, job_type, status, started_at, completed_at, error_message, metadata_json) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do update set status = excluded.status, completed_at = excluded.completed_at, error_message = excluded.error_message, metadata_json = excluded.metadata_json',
        [row.id, row.provider, row.integration_id, row.organization_id, row.job_type, row.status, row.started_at, row.completed_at, row.error_message, JSON.stringify(row.metadata_json)],
      );
    }
  }

  async listSignalIngestions(): Promise<SignalIngestionRecord[]> {
    const result = await this.db.query<SignalIngestionRow>('select * from signal_ingestion_records order by normalized_at desc');
    return result.rows.map((row) => riskEngineMappers.fromSignalIngestionRow(row));
  }

  async saveSignalIngestions(records: SignalIngestionRecord[]): Promise<void> {
    for (const record of records) {
      const row = riskEngineMappers.toSignalIngestionRow(record);
      await this.db.query(
        'insert into signal_ingestion_records (id, signal_id, provider, integration_id, organization_id, resource_id, ingested_at, normalized_at, job_execution_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do update set normalized_at = excluded.normalized_at, job_execution_id = excluded.job_execution_id',
        [row.id, row.signal_id, row.provider, row.integration_id, row.organization_id, row.resource_id, row.ingested_at, row.normalized_at, row.job_execution_id],
      );
    }
  }

  async listProviderStatuses(): Promise<ProviderSyncStatusRecord[]> {
    const result = await this.db.query<ProviderSyncStatusRow>('select * from provider_sync_statuses order by last_sync_at desc');
    return result.rows.map((row) => riskEngineMappers.fromProviderSyncStatusRow(row));
  }

  async saveProviderStatuses(statuses: ProviderSyncStatusRecord[]): Promise<void> {
    for (const status of statuses) {
      const row = riskEngineMappers.toProviderSyncStatusRow(status);
      await this.db.query(
        'insert into provider_sync_statuses (id, provider, integration_id, status, last_sync_at, last_success_at, signals_collected, tests_evaluated, open_risks) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do update set status = excluded.status, last_sync_at = excluded.last_sync_at, last_success_at = excluded.last_success_at, signals_collected = excluded.signals_collected, tests_evaluated = excluded.tests_evaluated, open_risks = excluded.open_risks',
        [
          row.id,
          row.provider,
          row.integration_id,
          row.status,
          row.last_sync_at,
          row.last_success_at,
          row.signals_collected,
          row.tests_evaluated,
          row.open_risks,
        ],
      );
    }
  }

  async listScanRuns(): Promise<ScanRunRecord[]> {
    const result = await this.db.query<ScanRunRow>('select * from scan_runs order by completed_at desc');
    return result.rows.map((row) => riskEngineMappers.fromScanRunRow(row));
  }

  async listEvents(): Promise<RiskEngineEventRecord[]> {
    const result = await this.db.query<RiskEngineEventRow>('select * from risk_engine_events order by created_at desc');
    return result.rows.map((row) => riskEngineMappers.fromRiskEngineEventRow(row));
  }

  async listTestResults(): Promise<TestResultRecord[]> {
    const result = await this.db.query<TestResultRow>('select * from test_results order by executed_at desc');
    return result.rows.map((row) => riskEngineMappers.fromTestResultRow(row));
  }

  async saveTestResults(results: TestResultRecord[]): Promise<void> {
    for (const result of results) {
      const row = riskEngineMappers.toTestResultRow(result);
      await this.db.query(
        'insert into test_results (id, organization_id, test_id, signal_id, status, severity, reason, evidence_snapshot_ids_json, executed_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do update set status = excluded.status, severity = excluded.severity, reason = excluded.reason, evidence_snapshot_ids_json = excluded.evidence_snapshot_ids_json, executed_at = excluded.executed_at',
        [row.id, row.organization_id, row.test_id, row.signal_id, row.status, row.severity, row.reason, JSON.stringify(row.evidence_snapshot_ids_json), row.executed_at],
      );
    }
  }

  async listRisks(): Promise<RiskEngineRecord[]> {
    const result = await this.db.query<GeneratedRiskRow>('select * from generated_risks order by score desc');
    return result.rows.map((row) => riskEngineMappers.fromGeneratedRiskRow(row));
  }

  async saveRisks(risks: RiskEngineRecord[]): Promise<void> {
    for (const risk of risks) {
      await this.db.query(
        'insert into generated_risks (id, organization_id, dedupe_key, test_result_id, rule_id, title, category, severity, likelihood, score, status, resource_id, resource_name, control_ids_json, framework_ids_json, evidence_snapshot_ids_json, owner_team, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) on conflict (dedupe_key) do update set test_result_id = excluded.test_result_id, score = excluded.score, status = excluded.status, framework_ids_json = excluded.framework_ids_json, evidence_snapshot_ids_json = excluded.evidence_snapshot_ids_json, updated_at = excluded.updated_at',
        [
          risk.id,
          risk.organizationId,
          risk.dedupeKey,
          risk.testResultId,
          risk.ruleId,
          risk.title,
          risk.category,
          risk.severity,
          risk.likelihood,
          risk.score,
          risk.status,
          risk.resourceId,
          risk.resourceName,
          JSON.stringify(risk.controlIds),
          JSON.stringify(risk.frameworkIds),
          JSON.stringify(risk.evidenceSnapshotIds),
          risk.ownerTeam,
          risk.createdAt,
          risk.updatedAt,
        ],
      );
    }
  }

  async saveScanRun(run: ScanRunRecord): Promise<void> {
    const row = riskEngineMappers.toScanRunRow(run);
    await this.db.query(
      'insert into scan_runs (id, provider, integration_id, started_at, completed_at, status, signals_ingested, tests_executed, risks_generated, trigger) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do update set completed_at = excluded.completed_at, status = excluded.status, signals_ingested = excluded.signals_ingested, tests_executed = excluded.tests_executed, risks_generated = excluded.risks_generated, trigger = excluded.trigger',
      [
        row.id,
        row.provider,
        row.integration_id,
        row.started_at,
        row.completed_at,
        row.status,
        row.signals_ingested,
        row.tests_executed,
        row.risks_generated,
        row.trigger,
      ],
    );
  }

  async appendEvents(events: RiskEngineEventRecord[]): Promise<void> {
    for (const event of events) {
      const row = riskEngineMappers.toRiskEngineEventRow(event);
      await this.db.query(
        'insert into risk_engine_events (id, organization_id, event_type, provider, integration_id, resource_id, severity, message, metadata_json, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do nothing',
        [
          row.id,
          row.organization_id,
          row.event_type,
          row.provider,
          row.integration_id,
          row.resource_id,
          row.severity,
          row.message,
          JSON.stringify(row.metadata_json),
          row.created_at,
        ],
      );
    }
  }
}
