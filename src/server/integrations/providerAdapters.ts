import type { NormalizedSignal, NormalizedSignalType, SignalProvider } from '@/domain/risk-engine/types';

export interface IntegrationScanPayload {
  organizationId?: string;
  integrationId?: string;
  records?: Array<Record<string, unknown>>;
}

export interface ProviderAdapter {
  provider: SignalProvider;
  routeKey: string;
  buildSignals(input: {
    organizationId: string;
    integrationId: string;
    records: Array<Record<string, unknown>>;
    collectedAt: string;
  }): NormalizedSignal[];
}

function bool(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function str(value: unknown, fallback: string) {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  return typeof value === 'number' ? value : fallback;
}

function makeSignal(params: {
  id: string;
  organizationId: string;
  integrationId: string;
  provider: SignalProvider;
  signalType: NormalizedSignalType;
  resourceType: NormalizedSignal['resourceType'];
  resourceId: string;
  resourceName: string;
  value: NormalizedSignal['value'];
  metadata: Record<string, unknown>;
  collectedAt: string;
}): NormalizedSignal {
  return {
    id: params.id,
    organizationId: params.organizationId,
    integrationId: params.integrationId,
    provider: params.provider,
    signalType: params.signalType,
    resourceType: params.resourceType,
    resourceId: params.resourceId,
    resourceName: params.resourceName,
    value: params.value,
    metadata: params.metadata,
    observedAt: params.collectedAt,
    collectedAt: params.collectedAt,
  };
}

function buildPerRecordSignals(args: {
  provider: SignalProvider;
  routeKey: string;
  organizationId: string;
  integrationId: string;
  records: Array<Record<string, unknown>>;
  collectedAt: string;
  factory: (record: Record<string, unknown>, index: number) => Array<Omit<NormalizedSignal, 'organizationId' | 'integrationId' | 'provider' | 'observedAt' | 'collectedAt'>>;
}) {
  return args.records.flatMap((record, index) =>
    args.factory(record, index).map((signal) => ({
      ...signal,
      organizationId: args.organizationId,
      integrationId: args.integrationId,
      provider: args.provider,
      observedAt: args.collectedAt,
      collectedAt: args.collectedAt,
    })),
  );
}

export const integrationProviderAdapters: ProviderAdapter[] = [
  {
    provider: 'okta',
    routeKey: 'okta',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'okta',
        routeKey: 'okta',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.id, `okta-user-${index}`);
          const email = str(record.userEmail, `user-${index}@example.com`);
          return [
            makeSignal({
              id: `sig-okta-mfa-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'okta',
              signalType: 'IDENTITY_MFA_ENABLED',
              resourceType: 'identity',
              resourceId,
              resourceName: email,
              value: bool(record.mfaEnabled, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'google-workspace',
    routeKey: 'workspace',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'google-workspace',
        routeKey: 'workspace',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.id, `workspace-user-${index}`);
          const email = str(record.email, `workspace-${index}@example.com`);
          return [
            makeSignal({
              id: `sig-workspace-mfa-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'google-workspace',
              signalType: 'IDENTITY_MFA_ENABLED',
              resourceType: 'identity',
              resourceId,
              resourceName: email,
              value: bool(record.mfaEnabled, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'fleet',
    routeKey: 'fleet',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'fleet',
        routeKey: 'fleet',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.id, `fleet-host-${index}`);
          const name = str(record.hostname, str(record.displayName, `fleet-host-${index}`));
          return [
            makeSignal({
              id: `sig-fleet-disk-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'fleet',
              signalType: 'DEVICE_DISK_ENCRYPTED',
              resourceType: 'device',
              resourceId,
              resourceName: name,
              value: bool(record.diskEncrypted, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'snyk',
    routeKey: 'snyk',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'snyk',
        routeKey: 'snyk',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.id, `snyk-project-${index}`);
          const name = str(record.projectName, str(record.title, `snyk-project-${index}`));
          return [
            makeSignal({
              id: `sig-snyk-critical-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'snyk',
              signalType: 'VULNERABILITY_CRITICAL_OPEN',
              resourceType: 'repository',
              resourceId,
              resourceName: name,
              value: num(record.criticalOpenCount, record.severity === 'CRITICAL' ? 1 : 0),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'aws',
    routeKey: 'aws',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'aws',
        routeKey: 'aws',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.bucketId, str(record.resourceId, `aws-resource-${index}`));
          const name = str(record.bucketName, str(record.resourceName, resourceId));
          return [
            makeSignal({
              id: `sig-aws-public-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'aws',
              signalType: 'CLOUD_STORAGE_PUBLIC_ACCESS',
              resourceType: 'bucket',
              resourceId,
              resourceName: name,
              value: bool(record.publicAccess, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'azure',
    routeKey: 'azure',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'azure',
        routeKey: 'azure',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.resourceId, `azure-resource-${index}`);
          const name = str(record.resourceName, resourceId);
          return [
            makeSignal({
              id: `sig-azure-public-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'azure',
              signalType: 'CLOUD_STORAGE_PUBLIC_ACCESS',
              resourceType: 'bucket',
              resourceId,
              resourceName: name,
              value: bool(record.publicAccess, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
  {
    provider: 'cloudflare',
    routeKey: 'cloudflare',
    buildSignals: ({ organizationId, integrationId, records, collectedAt }) =>
      buildPerRecordSignals({
        provider: 'cloudflare',
        routeKey: 'cloudflare',
        organizationId,
        integrationId,
        records,
        collectedAt,
        factory: (record, index) => {
          const resourceId = str(record.zoneId, `cf-zone-${index}`);
          const name = str(record.zoneName, resourceId);
          return [
            makeSignal({
              id: `sig-cloudflare-waf-${resourceId}`,
              organizationId,
              integrationId,
              provider: 'cloudflare',
              signalType: 'NETWORK_WAF_ENABLED',
              resourceType: 'application',
              resourceId,
              resourceName: name,
              value: bool(record.wafEnabled, false),
              metadata: record,
              collectedAt,
            }),
          ];
        },
      }),
  },
];

export function getIntegrationProviderAdapter(routeKey: string) {
  return integrationProviderAdapters.find((adapter) => adapter.routeKey === routeKey) ?? null;
}
