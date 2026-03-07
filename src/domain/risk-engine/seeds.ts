import {
  seedEvidence,
  seedEvents,
  seedIntegrationExecutions,
  seedProviderStatuses,
  seedRules,
  seedScanRuns,
  seedSignalIngestions,
  seedSignals,
  seedTests,
} from './mockData';
import type { SqlExecutor } from './persistence';
import { riskEngineMappers } from './persistence';

export async function seedRiskEngineFoundation(executor: SqlExecutor) {
  for (const signal of seedSignals) {
    const row = riskEngineMappers.toSignalRow(signal);
    await executor.query(
      'insert into signals_normalized (id, organization_id, integration_id, provider, signal_type, resource_type, resource_id, resource_name, signal_value_text, signal_value_number, signal_value_boolean, metadata_json, observed_at, collected_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) on conflict (id) do nothing',
      [row.id, row.organization_id, row.integration_id, row.provider, row.signal_type, row.resource_type, row.resource_id, row.resource_name, row.signal_value_text, row.signal_value_number, row.signal_value_boolean, JSON.stringify(row.metadata_json), row.observed_at, row.collected_at],
    );
  }

  for (const test of seedTests) {
    await executor.query(
      'insert into control_test_versions (id, control_id, name, description, signal_type, version, severity_on_fail, condition_json, framework_ids_json) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing',
      [test.id, test.controlId, test.name, test.description, test.signalType, test.version, test.severityOnFail, JSON.stringify(test.condition), JSON.stringify(test.frameworkIds)],
    );
  }

  for (const rule of seedRules) {
    await executor.query(
      'insert into risk_rules (id, name, signal_type, category, default_likelihood, severity_weight, asset_criticality_weight, duration_weight) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing',
      [rule.id, rule.name, rule.signalType, rule.category, rule.defaultLikelihood, rule.severityWeight, rule.assetCriticalityWeight, rule.durationWeight],
    );
  }

  for (const evidence of seedEvidence) {
    await executor.query(
      'insert into evidence_snapshots (id, organization_id, kind, provider, integration_id, resource_id, control_id, test_id, snapshot_hash, payload_json, captured_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) on conflict (id) do nothing',
      [evidence.id, evidence.organizationId, evidence.kind, evidence.provider, evidence.integrationId, evidence.resourceId, evidence.controlId ?? null, evidence.testId ?? null, evidence.hash, JSON.stringify(evidence.payload), evidence.capturedAt],
    );
  }

  for (const status of seedProviderStatuses) {
    const row = riskEngineMappers.toProviderSyncStatusRow(status);
    await executor.query(
      'insert into provider_sync_statuses (id, provider, integration_id, status, last_sync_at, last_success_at, signals_collected, tests_evaluated, open_risks) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing',
      [row.id, row.provider, row.integration_id, row.status, row.last_sync_at, row.last_success_at, row.signals_collected, row.tests_evaluated, row.open_risks],
    );
  }

  for (const run of seedScanRuns) {
    const row = riskEngineMappers.toScanRunRow(run);
    await executor.query(
      'insert into scan_runs (id, provider, integration_id, started_at, completed_at, status, signals_ingested, tests_executed, risks_generated, trigger) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do nothing',
      [row.id, row.provider, row.integration_id, row.started_at, row.completed_at, row.status, row.signals_ingested, row.tests_executed, row.risks_generated, row.trigger],
    );
  }

  for (const execution of seedIntegrationExecutions) {
    const row = riskEngineMappers.toIntegrationJobExecutionRow(execution);
    await executor.query(
      'insert into integration_job_executions (id, provider, integration_id, organization_id, job_type, status, started_at, completed_at, error_message, metadata_json) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do nothing',
      [row.id, row.provider, row.integration_id, row.organization_id, row.job_type, row.status, row.started_at, row.completed_at, row.error_message, JSON.stringify(row.metadata_json)],
    );
  }

  for (const ingestion of seedSignalIngestions) {
    const row = riskEngineMappers.toSignalIngestionRow(ingestion);
    await executor.query(
      'insert into signal_ingestion_records (id, signal_id, provider, integration_id, organization_id, resource_id, ingested_at, normalized_at, job_execution_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict (id) do nothing',
      [row.id, row.signal_id, row.provider, row.integration_id, row.organization_id, row.resource_id, row.ingested_at, row.normalized_at, row.job_execution_id],
    );
  }

  for (const event of seedEvents) {
    const row = riskEngineMappers.toRiskEngineEventRow(event);
    await executor.query(
      'insert into risk_engine_events (id, organization_id, event_type, provider, integration_id, resource_id, severity, message, metadata_json, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (id) do nothing',
      [row.id, row.organization_id, row.event_type, row.provider, row.integration_id, row.resource_id, row.severity, row.message, JSON.stringify(row.metadata_json), row.created_at],
    );
  }
}
