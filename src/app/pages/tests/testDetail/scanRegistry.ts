// ─── Provider Scan Registry ───────────────────────────────────────────────────
// Declarative registry replacing if/else dispatch chains.

export interface ProviderScanEntry {
  match: (provider: string) => boolean;
  run: (meta: Record<string, string>) => Promise<unknown>;
  label: string;
}

function buildScanRegistry(): ProviderScanEntry[] {
  // Lazy-loaded to avoid circular import issues at module-parse time
  return [
    { match: (p) => p === 'NEWRELIC', label: 'New Relic', run: async () => { const { newRelicService } = await import('@/services/api/newrelic'); return newRelicService.runScan(); } },
    { match: (p) => p.startsWith('AWS_'), label: 'AWS', run: async (m) => { const { awsService } = await import('@/services/api/aws'); return awsService.runScan(m.awsAccountDbId ?? ''); } },
    { match: (p) => p.startsWith('CLOUDFLARE_'), label: 'Cloudflare', run: async (m) => { const { cloudflareService } = await import('@/services/api/cloudflare'); return cloudflareService.runScan(m.cfAccountDbId ?? ''); } },
    { match: (p) => p.startsWith('BAMBOOHR_'), label: 'BambooHR', run: async (m) => { const { bamboohrService } = await import('@/services/api/bamboohr'); return bamboohrService.runScan(m.hrIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('REDASH_'), label: 'Redash', run: async (m) => { const { redashService } = await import('@/services/api/redash'); return redashService.runScan(m.redashIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('GOOGLE_WORKSPACE_'), label: 'Google Workspace', run: async (m) => { const { workspaceService } = await import('@/services/api/workspace'); return workspaceService.runScan(m.workspaceIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('FLEET_'), label: 'Fleet', run: async (m) => { const { fleetService } = await import('@/services/api/fleet'); return fleetService.runScan(m.fleetIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('INTERCOM_'), label: 'Intercom', run: async (m) => { const { intercomService } = await import('@/services/api/intercom'); return intercomService.runScan(m.intercomIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('BIGID_'), label: 'BigID', run: async (m) => { const { bigIdService } = await import('@/services/api/bigid'); return bigIdService.runScan(m.bigIdIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('PAGERDUTY_'), label: 'PagerDuty', run: async (m) => { const { pagerdutyService } = await import('@/services/api/pagerduty'); return pagerdutyService.runScan(m.pagerdutyIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('OPSGENIE_'), label: 'Opsgenie', run: async (m) => { const { opsgenieService } = await import('@/services/api/opsgenie'); return opsgenieService.runScan(m.opsgenieIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SERVICENOW_INCIDENT_'), label: 'ServiceNow', run: async (m) => { const { servicenowIncidentService } = await import('@/services/api/servicenow-incident'); return servicenowIncidentService.runScan(m.servicenowIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('DATADOG_INCIDENTS_'), label: 'Datadog', run: async (m) => { const { datadogIncidentsService } = await import('@/services/api/datadog-incidents'); return datadogIncidentsService.runScan(m.datadogIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('GCP_'), label: 'GCP', run: async (m) => { const { gcpService } = await import('@/services/api/gcp'); return gcpService.runScan(m.gcpIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('AZURE_AD_'), label: 'Azure AD', run: async (m) => { const { azureAdService } = await import('@/services/api/azuread'); return azureAdService.runScan(m.azureAdIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('AZURE_'), label: 'Azure', run: async (m) => { const { azureService } = await import('@/services/api/azure'); return azureService.runScan(m.azureIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('WIZ_'), label: 'Wiz', run: async (m) => { const { wizService } = await import('@/services/api/wiz'); return wizService.runScan(m.wizIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('LACEWORK_'), label: 'Lacework', run: async (m) => { const { laceworkService } = await import('@/services/api/lacework'); return laceworkService.runScan(m.laceworkIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SNYK_'), label: 'Snyk', run: async (m) => { const { snykService } = await import('@/services/api/snyk'); return snykService.runScan(m.snykIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SONARQUBE_'), label: 'SonarQube', run: async (m) => { const { sonarqubeService } = await import('@/services/api/sonarqube'); return sonarqubeService.runScan(m.sonarQubeIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('VERACODE_'), label: 'Veracode', run: async (m) => { const { veracodeService } = await import('@/services/api/veracode'); return veracodeService.runScan(m.veracodeIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('CHECKMARX_'), label: 'Checkmarx', run: async (m) => { const { checkmarxService } = await import('@/services/api/checkmarx'); return checkmarxService.runScan(m.checkmarxIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('VAULT_'), label: 'HashiCorp Vault', run: async (m) => { const { vaultService } = await import('@/services/api/vault'); return vaultService.runScan(m.vaultIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('SECRETS_MANAGER_'), label: 'AWS Secrets Manager', run: async (m) => { const { secretsManagerService } = await import('@/services/api/secretsmanager'); return secretsManagerService.runScan(m.secretsManagerIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('CERT_MANAGER_'), label: 'Certificate Manager', run: async (m) => { const { certManagerService } = await import('@/services/api/certmanager'); return certManagerService.runScan(m.certManagerIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('OKTA_'), label: 'Okta', run: async (m) => { const { oktaService } = await import('@/services/api/okta'); return oktaService.runScan(m.oktaIntegrationId ?? ''); } },
    { match: (p) => p.startsWith('JUMPCLOUD_'), label: 'JumpCloud', run: async (m) => { const { jumpCloudService } = await import('@/services/api/jumpcloud'); return jumpCloudService.runScan(m.jumpCloudIntegrationId ?? ''); } },
  ];
}

let _scanRegistry: ProviderScanEntry[] | null = null;
export function getScanRegistry(): ProviderScanEntry[] {
  if (!_scanRegistry) _scanRegistry = buildScanRegistry();
  return _scanRegistry;
}

export async function dispatchScan(provider: string, metadata: Record<string, string>): Promise<unknown> {
  const entry = getScanRegistry().find((e) => e.match(provider));
  if (entry) return entry.run(metadata);
  const { integrationsService } = await import('@/services/api/integrations');
  return integrationsService.runAutomatedTests();
}

export function getProviderLabel(provider: string): string {
  return getScanRegistry().find((e) => e.match(provider))?.label ?? provider;
}
