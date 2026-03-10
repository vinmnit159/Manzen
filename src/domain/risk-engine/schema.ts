export type SqlColumnType =
  | 'uuid'
  | 'text'
  | 'varchar(255)'
  | 'integer'
  | 'numeric(12,2)'
  | 'boolean'
  | 'jsonb'
  | 'timestamp with time zone';

export interface TableColumn {
  name: string;
  type: SqlColumnType;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  defaultValue?: string;
}

export interface TableDefinition {
  name: string;
  columns: TableColumn[];
  indexes?: Array<{ name: string; columns: string[]; unique?: boolean }>;
}

export const riskEngineTables: TableDefinition[] = [
  {
    name: 'signals_normalized',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'integration_id', type: 'uuid' },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'signal_type', type: 'varchar(255)' },
      { name: 'resource_type', type: 'varchar(255)' },
      { name: 'resource_id', type: 'varchar(255)' },
      { name: 'resource_name', type: 'varchar(255)' },
      { name: 'signal_value_text', type: 'text', nullable: true },
      { name: 'signal_value_number', type: 'numeric(12,2)', nullable: true },
      { name: 'signal_value_boolean', type: 'boolean', nullable: true },
      { name: 'metadata_json', type: 'jsonb', defaultValue: "'{}'::jsonb" },
      { name: 'observed_at', type: 'timestamp with time zone' },
      { name: 'collected_at', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_signals_org_type_resource', columns: ['organization_id', 'signal_type', 'resource_id'] },
      { name: 'idx_signals_org_collected', columns: ['organization_id', 'collected_at'] },
    ],
  },
  {
    name: 'control_test_versions',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'control_id', type: 'uuid' },
      { name: 'name', type: 'varchar(255)' },
      { name: 'description', type: 'text' },
      { name: 'signal_type', type: 'varchar(255)' },
      { name: 'version', type: 'integer' },
      { name: 'severity_on_fail', type: 'varchar(255)' },
      { name: 'condition_json', type: 'jsonb' },
      { name: 'framework_ids_json', type: 'jsonb', defaultValue: "'[]'::jsonb" },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_control_test_versions_control', columns: ['control_id', 'version'], unique: true },
    ],
  },
  {
    name: 'evidence_snapshots',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'kind', type: 'varchar(255)' },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'uuid' },
      { name: 'resource_id', type: 'varchar(255)' },
      { name: 'control_id', type: 'uuid', nullable: true },
      { name: 'test_id', type: 'uuid', nullable: true },
      { name: 'snapshot_hash', type: 'varchar(255)', unique: true },
      { name: 'payload_json', type: 'jsonb' },
      { name: 'captured_at', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_evidence_org_resource', columns: ['organization_id', 'resource_id'] },
      { name: 'idx_evidence_org_test', columns: ['organization_id', 'test_id'] },
    ],
  },
  {
    name: 'test_results',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'test_id', type: 'uuid' },
      { name: 'signal_id', type: 'uuid' },
      { name: 'status', type: 'varchar(255)' },
      { name: 'severity', type: 'varchar(255)' },
      { name: 'reason', type: 'text' },
      { name: 'evidence_snapshot_ids_json', type: 'jsonb', defaultValue: "'[]'::jsonb" },
      { name: 'executed_at', type: 'timestamp with time zone' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_test_results_org_status', columns: ['organization_id', 'status'] },
      { name: 'idx_test_results_signal', columns: ['signal_id', 'executed_at'] },
    ],
  },
  {
    name: 'risk_rules',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'name', type: 'varchar(255)' },
      { name: 'signal_type', type: 'varchar(255)' },
      { name: 'category', type: 'varchar(255)' },
      { name: 'default_likelihood', type: 'varchar(255)' },
      { name: 'severity_weight', type: 'integer' },
      { name: 'asset_criticality_weight', type: 'integer' },
      { name: 'duration_weight', type: 'integer' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_risk_rules_signal_type', columns: ['signal_type'] },
    ],
  },
  {
    name: 'generated_risks',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'dedupe_key', type: 'varchar(255)', unique: true },
      { name: 'test_result_id', type: 'uuid' },
      { name: 'rule_id', type: 'uuid' },
      { name: 'title', type: 'varchar(255)' },
      { name: 'category', type: 'varchar(255)' },
      { name: 'severity', type: 'varchar(255)' },
      { name: 'likelihood', type: 'varchar(255)' },
      { name: 'score', type: 'integer' },
      { name: 'status', type: 'varchar(255)' },
      { name: 'resource_id', type: 'varchar(255)' },
      { name: 'resource_name', type: 'varchar(255)' },
      { name: 'control_ids_json', type: 'jsonb', defaultValue: "'[]'::jsonb" },
      { name: 'framework_ids_json', type: 'jsonb', defaultValue: "'[]'::jsonb" },
      { name: 'evidence_snapshot_ids_json', type: 'jsonb', defaultValue: "'[]'::jsonb" },
      { name: 'owner_team', type: 'varchar(255)' },
      { name: 'created_at', type: 'timestamp with time zone' },
      { name: 'updated_at', type: 'timestamp with time zone' },
    ],
    indexes: [
      { name: 'idx_generated_risks_org_status', columns: ['organization_id', 'status'] },
      { name: 'idx_generated_risks_org_severity', columns: ['organization_id', 'severity'] },
    ],
  },
  {
    name: 'risk_engine_events',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'event_type', type: 'varchar(255)' },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'varchar(255)' },
      { name: 'resource_id', type: 'varchar(255)' },
      { name: 'severity', type: 'varchar(255)' },
      { name: 'message', type: 'text' },
      { name: 'metadata_json', type: 'jsonb', defaultValue: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamp with time zone' },
    ],
    indexes: [
      { name: 'idx_risk_engine_events_org_created', columns: ['organization_id', 'created_at'] },
      { name: 'idx_risk_engine_events_type', columns: ['event_type', 'severity'] },
      { name: 'idx_risk_engine_events_provider', columns: ['provider', 'integration_id'] },
    ],
  },
  {
    name: 'provider_sync_statuses',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'varchar(255)' },
      { name: 'status', type: 'varchar(255)' },
      { name: 'last_sync_at', type: 'timestamp with time zone' },
      { name: 'last_success_at', type: 'timestamp with time zone' },
      { name: 'signals_collected', type: 'integer' },
      { name: 'tests_evaluated', type: 'integer' },
      { name: 'open_risks', type: 'integer' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
      { name: 'updated_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_provider_sync_statuses_provider', columns: ['provider', 'integration_id'], unique: true },
      { name: 'idx_provider_sync_statuses_status', columns: ['status', 'last_sync_at'] },
    ],
  },
  {
    name: 'integration_job_executions',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'varchar(255)' },
      { name: 'organization_id', type: 'uuid' },
      { name: 'job_type', type: 'varchar(255)' },
      { name: 'status', type: 'varchar(255)' },
      { name: 'started_at', type: 'timestamp with time zone' },
      { name: 'completed_at', type: 'timestamp with time zone' },
      { name: 'error_message', type: 'text', nullable: true },
      { name: 'metadata_json', type: 'jsonb', defaultValue: "'{}'::jsonb" },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_integration_job_exec_provider', columns: ['provider', 'integration_id', 'completed_at'] },
      { name: 'idx_integration_job_exec_org_status', columns: ['organization_id', 'status'] },
    ],
  },
  {
    name: 'signal_ingestion_records',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'signal_id', type: 'uuid' },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'varchar(255)' },
      { name: 'organization_id', type: 'uuid' },
      { name: 'resource_id', type: 'varchar(255)' },
      { name: 'ingested_at', type: 'timestamp with time zone' },
      { name: 'normalized_at', type: 'timestamp with time zone' },
      { name: 'job_execution_id', type: 'uuid' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_signal_ingestions_signal', columns: ['signal_id', 'normalized_at'] },
      { name: 'idx_signal_ingestions_provider', columns: ['provider', 'integration_id', 'ingested_at'] },
    ],
  },
  {
    name: 'scan_runs',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'provider', type: 'varchar(255)' },
      { name: 'integration_id', type: 'varchar(255)' },
      { name: 'started_at', type: 'timestamp with time zone' },
      { name: 'completed_at', type: 'timestamp with time zone' },
      { name: 'status', type: 'varchar(255)' },
      { name: 'signals_ingested', type: 'integer' },
      { name: 'tests_executed', type: 'integer' },
      { name: 'risks_generated', type: 'integer' },
      { name: 'trigger', type: 'varchar(255)' },
      { name: 'created_at', type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_scan_runs_provider_completed', columns: ['provider', 'completed_at'] },
      { name: 'idx_scan_runs_status', columns: ['status', 'started_at'] },
    ],
  },
];

export function renderCreateTableSql(table: TableDefinition) {
  const columnSql = table.columns.map((column) => {
    const parts = [column.name, column.type];
    if (column.primaryKey) parts.push('primary key');
    if (!column.nullable && !column.primaryKey) parts.push('not null');
    if (column.unique) parts.push('unique');
    if (column.defaultValue) parts.push(`default ${column.defaultValue}`);
    return `  ${parts.join(' ')}`;
  }).join(',\n');

  const indexSql = (table.indexes ?? []).map((index) => {
    const unique = index.unique ? 'unique ' : '';
    return `create ${unique}index if not exists ${index.name} on ${table.name} (${index.columns.join(', ')});`;
  }).join('\n');

  return [`create table if not exists ${table.name} (`, columnSql, ');', indexSql].filter(Boolean).join('\n');
}

export const riskEngineSchemaSql = riskEngineTables.map(renderCreateTableSql).join('\n\n');

// ── Framework catalog tables ───────────────────────────────────────────────────
// These are global (not tenant-specific) and seeded once at boot.
// Org-specific activation and mapping tables are also here.

export const frameworkTables: TableDefinition[] = [
  {
    name: 'frameworks',
    columns: [
      { name: 'id',          type: 'uuid',        primaryKey: true },
      { name: 'slug',        type: 'varchar(255)', unique: true },
      { name: 'name',        type: 'varchar(255)' },
      { name: 'version',     type: 'varchar(255)' },
      { name: 'description', type: 'text',         nullable: true },
      { name: 'status',      type: 'varchar(255)', defaultValue: "'active'" },
      { name: 'created_at',  type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
  },
  {
    name: 'framework_requirements',
    columns: [
      { name: 'id',           type: 'uuid',        primaryKey: true },
      { name: 'framework_id', type: 'uuid' },
      { name: 'code',         type: 'varchar(255)' },
      { name: 'title',        type: 'varchar(255)' },
      { name: 'description',  type: 'text',         nullable: true },
      { name: 'domain',       type: 'varchar(255)', nullable: true },
      { name: 'created_at',   type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_framework_requirements_fw_code', columns: ['framework_id', 'code'], unique: true },
    ],
  },
  {
    name: 'organization_frameworks',
    columns: [
      { name: 'id',              type: 'uuid',        primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'framework_id',    type: 'uuid' },
      { name: 'status',          type: 'varchar(255)', defaultValue: "'setup_in_progress'" },
      { name: 'activated_at',    type: 'timestamp with time zone', nullable: true },
      { name: 'activated_by',    type: 'uuid',         nullable: true },
      { name: 'archived_at',     type: 'timestamp with time zone', nullable: true },
      { name: 'archived_by',     type: 'uuid',         nullable: true },
      { name: 'scope_note',      type: 'text',         nullable: true },
      { name: 'created_at',      type: 'timestamp with time zone', defaultValue: 'now()' },
      { name: 'updated_at',      type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_org_frameworks_org_fw',  columns: ['organization_id', 'framework_id'], unique: true },
      { name: 'idx_org_frameworks_status',  columns: ['organization_id', 'status'] },
    ],
  },
  {
    // Tracks per-org per-requirement applicability, review state, owner, and due date.
    // Append-only insert behavior: rows are created at activation; updated in place
    // only for applicability/owner changes (not a time-series table like coverage snapshots).
    name: 'organization_framework_requirement_status',
    columns: [
      { name: 'id',                   type: 'uuid',        primaryKey: true },
      { name: 'organization_id',      type: 'uuid' },
      { name: 'framework_requirement_id', type: 'uuid' },
      { name: 'applicability_status', type: 'varchar(255)', defaultValue: "'applicable'" },
      { name: 'justification',        type: 'text',         nullable: true },
      { name: 'review_status',        type: 'varchar(255)', defaultValue: "'not_started'" },
      { name: 'owner_id',             type: 'uuid',         nullable: true },
      { name: 'due_date',             type: 'timestamp with time zone', nullable: true },
      { name: 'updated_at',           type: 'timestamp with time zone', defaultValue: 'now()' },
      { name: 'updated_by',           type: 'uuid',         nullable: true },
    ],
    indexes: [
      { name: 'idx_ofrs_org_req', columns: ['organization_id', 'framework_requirement_id'], unique: true },
      { name: 'idx_ofrs_org_applicability', columns: ['organization_id', 'applicability_status'] },
    ],
  },
  {
    // Append-only coverage snapshots. Never UPDATE; always INSERT a new row.
    // Dashboard reads latest row per org+framework via ORDER BY calculated_at DESC LIMIT 1.
    name: 'framework_coverage_snapshots',
    columns: [
      { name: 'id',                   type: 'uuid',    primaryKey: true },
      { name: 'organization_id',      type: 'uuid' },
      { name: 'framework_id',         type: 'uuid' },
      // Layer 1 — canonical baseline
      { name: 'total_requirements',   type: 'integer' },
      // Layer 2 — org adoption
      { name: 'total_mapped',         type: 'integer' },
      // Layer 3 — applicability
      { name: 'not_applicable',       type: 'integer' },
      { name: 'applicable',           type: 'integer' },
      // Layer 4 — implementation (of applicable only)
      { name: 'covered',              type: 'integer' },
      { name: 'partially_covered',    type: 'integer' },
      { name: 'not_covered',          type: 'integer' },
      // Derived scores
      { name: 'control_coverage_pct', type: 'integer' },
      { name: 'test_pass_rate_pct',   type: 'integer' },
      // Test counts (separate metric)
      { name: 'mapped_test_count',    type: 'integer' },
      { name: 'passing_test_count',   type: 'integer' },
      // Gap summary
      { name: 'open_gaps',            type: 'integer' },
      { name: 'calculated_at',        type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_fw_coverage_org_fw_date', columns: ['organization_id', 'framework_id', 'calculated_at'] },
    ],
  },
  // ── Mapping tables ───────────────────────────────────────────────────────────
  {
    name: 'control_framework_requirement_mappings',
    columns: [
      { name: 'id',                      type: 'uuid', primaryKey: true },
      { name: 'organization_id',         type: 'uuid' },
      { name: 'control_id',              type: 'uuid' },   // isms-backend control UUID
      { name: 'framework_requirement_id',type: 'uuid' },
      { name: 'framework_id',            type: 'uuid' },   // denormalized for fast filtering
      { name: 'mapping_type',            type: 'varchar(255)', defaultValue: "'suggested'" },
      { name: 'created_at',              type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_ctrl_fw_req_map_org_fw',   columns: ['organization_id', 'framework_id'] },
      { name: 'idx_ctrl_fw_req_map_uniq',     columns: ['organization_id', 'control_id', 'framework_requirement_id'], unique: true },
    ],
  },
  {
    name: 'test_framework_requirement_mappings',
    columns: [
      { name: 'id',                      type: 'uuid', primaryKey: true },
      { name: 'organization_id',         type: 'uuid' },
      { name: 'test_id',                 type: 'uuid' },   // Manzen test UUID
      { name: 'framework_requirement_id',type: 'uuid' },
      { name: 'framework_id',            type: 'uuid' },
      { name: 'mapping_type',            type: 'varchar(255)', defaultValue: "'suggested'" },
      { name: 'created_at',              type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_test_fw_req_map_org_fw',   columns: ['organization_id', 'framework_id'] },
      { name: 'idx_test_fw_req_map_uniq',     columns: ['organization_id', 'test_id', 'framework_requirement_id'], unique: true },
    ],
  },
  {
    name: 'policy_framework_requirement_mappings',
    columns: [
      { name: 'id',                      type: 'uuid', primaryKey: true },
      { name: 'organization_id',         type: 'uuid' },
      { name: 'policy_id',               type: 'uuid' },   // isms-backend policy UUID
      { name: 'framework_requirement_id',type: 'uuid' },
      { name: 'framework_id',            type: 'uuid' },
      { name: 'created_at',              type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_policy_fw_req_map_org_fw',  columns: ['organization_id', 'framework_id'] },
      { name: 'idx_policy_fw_req_map_uniq',    columns: ['organization_id', 'policy_id', 'framework_requirement_id'], unique: true },
    ],
  },
  {
    name: 'subscription_entitlements',
    columns: [
      { name: 'id',              type: 'uuid',        primaryKey: true },
      { name: 'organization_id', type: 'uuid' },
      { name: 'framework_slug',  type: 'varchar(255)' },
      { name: 'plan_name',       type: 'varchar(255)' },
      { name: 'is_active',       type: 'boolean',     defaultValue: 'true' },
      { name: 'valid_from',      type: 'timestamp with time zone' },
      { name: 'valid_until',     type: 'timestamp with time zone', nullable: true },
      { name: 'created_at',      type: 'timestamp with time zone', defaultValue: 'now()' },
      { name: 'updated_at',      type: 'timestamp with time zone', defaultValue: 'now()' },
    ],
    indexes: [
      { name: 'idx_entitlements_org_fw', columns: ['organization_id', 'framework_slug', 'is_active'] },
      { name: 'idx_entitlements_org_fw_plan_uniq', columns: ['organization_id', 'framework_slug', 'plan_name'], unique: true },
    ],
  },
];

export const frameworkSchemaSql = frameworkTables.map(renderCreateTableSql).join('\n\n');
