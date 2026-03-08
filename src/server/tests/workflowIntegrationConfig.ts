import { createPgExecutor, getPostgresPool, readPostgresRuntimeConfig } from '@/server/db/postgres';

type WorkflowIntegrationProvider = 'slack' | 'jira' | 'github-actions' | 'siem';

interface WorkflowIntegrationConfigRecord {
  organizationId: string;
  provider: WorkflowIntegrationProvider;
  values: Record<string, string>;
  updatedAt: string;
}

const DEFAULT_ORG_ID = 'org_1';
const configStore = new Map<string, WorkflowIntegrationConfigRecord>();
let tableReady: Promise<void> | null = null;

function storeKey(organizationId: string, provider: WorkflowIntegrationProvider) {
  return `${organizationId}:${provider}`;
}

function asStringRecord(input: Record<string, unknown>) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    result[key] = trimmed;
  }
  return result;
}

function getDbExecutor() {
  const config = readPostgresRuntimeConfig();
  if (!config) return null;
  return createPgExecutor(getPostgresPool(config));
}

async function ensureTable() {
  const executor = getDbExecutor();
  if (!executor) return false;
  if (!tableReady) {
    tableReady = executor.query(`
      CREATE TABLE IF NOT EXISTS workflow_integration_configs (
        organization_id TEXT NOT NULL,
        provider TEXT NOT NULL,
        values JSONB NOT NULL DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (organization_id, provider)
      )
    `).then(() => undefined);
  }
  await tableReady;
  return true;
}

async function readFromDb(provider: WorkflowIntegrationProvider, organizationId: string) {
  const executor = getDbExecutor();
  if (!executor) return null;
  const ready = await ensureTable();
  if (!ready) return null;

  const result = await executor.query<{ organization_id: string; provider: string; values: Record<string, unknown>; updated_at: string }>(
    `SELECT organization_id, provider, values, updated_at::TEXT
       FROM workflow_integration_configs
      WHERE organization_id = $1 AND provider = $2`,
    [organizationId, provider],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    organizationId: row.organization_id,
    provider: row.provider as WorkflowIntegrationProvider,
    values: asStringRecord(row.values ?? {}),
    updatedAt: row.updated_at,
  } as WorkflowIntegrationConfigRecord;
}

export async function getWorkflowIntegrationConfig(provider: WorkflowIntegrationProvider, organizationId = DEFAULT_ORG_ID) {
  const fromDb = await readFromDb(provider, organizationId);
  if (fromDb) {
    configStore.set(storeKey(organizationId, provider), fromDb);
    return fromDb;
  }
  return configStore.get(storeKey(organizationId, provider)) ?? null;
}

export async function upsertWorkflowIntegrationConfig(params: {
  provider: WorkflowIntegrationProvider;
  values: Record<string, unknown>;
  organizationId?: string;
}) {
  const organizationId = params.organizationId ?? DEFAULT_ORG_ID;
  const key = storeKey(organizationId, params.provider);
  const current = (await readFromDb(params.provider, organizationId)) ?? configStore.get(key);
  const nextValues = { ...(current?.values ?? {}), ...asStringRecord(params.values) };

  const executor = getDbExecutor();
  if (executor) {
    const ready = await ensureTable();
    if (ready) {
      const result = await executor.query<{ organization_id: string; provider: string; values: Record<string, unknown>; updated_at: string }>(
        `INSERT INTO workflow_integration_configs (organization_id, provider, values, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (organization_id, provider)
         DO UPDATE SET
           values = workflow_integration_configs.values || EXCLUDED.values,
           updated_at = NOW()
         RETURNING organization_id, provider, values, updated_at::TEXT`,
        [organizationId, params.provider, JSON.stringify(asStringRecord(params.values))],
      );
      const row = result.rows[0];
      if (row) {
        const fromDb: WorkflowIntegrationConfigRecord = {
          organizationId: row.organization_id,
          provider: row.provider as WorkflowIntegrationProvider,
          values: asStringRecord(row.values ?? {}),
          updatedAt: row.updated_at,
        };
        configStore.set(key, fromDb);
        return fromDb;
      }
    }
  }

  const record: WorkflowIntegrationConfigRecord = {
    organizationId,
    provider: params.provider,
    values: nextValues,
    updatedAt: new Date().toISOString(),
  };

  configStore.set(key, record);
  return record;
}

async function providerStatus(provider: WorkflowIntegrationProvider, organizationId: string) {
  const record = await getWorkflowIntegrationConfig(provider, organizationId);
  return {
    provider,
    organizationId,
    configured: Boolean(record && Object.keys(record.values).length > 0),
    updatedAt: record?.updatedAt ?? null,
    configuredKeys: record ? Object.keys(record.values).sort() : [],
  };
}

export async function listWorkflowIntegrationConfigStatus(organizationId = DEFAULT_ORG_ID) {
  return Promise.all([
    providerStatus('slack', organizationId),
    providerStatus('jira', organizationId),
    providerStatus('github-actions', organizationId),
    providerStatus('siem', organizationId),
  ]);
}

export type { WorkflowIntegrationProvider };
