/**
 * Per-tab React Query hooks for the Integrations page.
 *
 * Each hook maps to one logical tab/category. Queries are only fired when
 * `enabled` is true, so data for off-screen tabs is never fetched until the
 * user actually navigates there. Caching means a return visit is instant.
 *
 * `Promise.allSettled` is used throughout so a single failing provider never
 * silences the rest — each provider carries its own `error` field.
 */

import { useQuery } from '@tanstack/react-query';
import {
  type GitHubRepo,
  type Integration,
  integrationsService,
} from '@/services/api/integrations';
import { mdmService, type MdmOverview } from '@/services/api/mdm';
import {
  slackService,
  type SlackChannel,
  type SlackIntegration,
} from '@/services/api/slack';
import { newRelicService, type NewRelicStatus } from '@/services/api/newrelic';
import { notionService, type NotionStatus } from '@/services/api/notion';
import { awsService, type AwsAccountRecord } from '@/services/api/aws';
import {
  cloudflareService,
  type CloudflareAccountRecord,
} from '@/services/api/cloudflare';
import { bamboohrService, type HRIntegrationRecord } from '@/services/api/bamboohr';
import { redashService, type RedashIntegrationRecord } from '@/services/api/redash';
import {
  workspaceService,
  type WorkspaceIntegrationRecord,
} from '@/services/api/workspace';
import { fleetService, type FleetIntegrationRecord } from '@/services/api/fleet';
import {
  intercomService,
  type IntercomIntegrationRecord,
} from '@/services/api/intercom';
import { bigIdService, type BigIdIntegrationRecord } from '@/services/api/bigid';
import {
  pagerdutyService,
  type PagerDutyIntegrationRecord,
} from '@/services/api/pagerduty';
import {
  opsgenieService,
  type OpsgenieIntegrationRecord,
} from '@/services/api/opsgenie';
import {
  servicenowIncidentService,
  type ServiceNowIntegrationRecord,
} from '@/services/api/servicenow-incident';
import {
  datadogIncidentsService,
  type DatadogIntegrationRecord,
} from '@/services/api/datadog-incidents';
import { gcpService, type GcpIntegrationRecord } from '@/services/api/gcp';
import { azureService, type AzureIntegrationRecord } from '@/services/api/azure';
import { wizService, type WizIntegrationRecord } from '@/services/api/wiz';
import {
  laceworkService,
  type LaceworkIntegrationRecord,
} from '@/services/api/lacework';
import { snykService, type SnykIntegrationRecord } from '@/services/api/snyk';
import {
  sonarqubeService,
  type SonarQubeIntegrationRecord,
} from '@/services/api/sonarqube';
import {
  veracodeService,
  type VeracodeIntegrationRecord,
} from '@/services/api/veracode';
import {
  checkmarxService,
  type CheckmarxIntegrationRecord,
} from '@/services/api/checkmarx';
import { vaultService, type VaultIntegrationRecord } from '@/services/api/vault';
import {
  secretsManagerService,
  type SecretsManagerIntegrationRecord,
} from '@/services/api/secretsmanager';
import {
  certManagerService,
  type CertManagerIntegrationRecord,
} from '@/services/api/certmanager';
import { oktaService, type OktaIntegrationRecord } from '@/services/api/okta';
import {
  azureAdService,
  type AzureAdIntegrationRecord,
} from '@/services/api/azuread';
import {
  jumpCloudService,
  type JumpCloudIntegrationRecord,
} from '@/services/api/jumpcloud';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unwrap a settled promise, returning null for rejections. */
function settled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

/** Extract error message from a settled promise, returning null for successes. */
function settledError(result: PromiseSettledResult<unknown>): string | null {
  if (result.status === 'rejected') {
    const reason = result.reason;
    if (reason instanceof Error) return reason.message;
    return String(reason);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Tab 1 — Core: GitHub / Google Drive / Slack / MDM / New Relic
// ---------------------------------------------------------------------------

export interface CoreIntegrationsData {
  githubIntegration: Integration | null;
  githubError: string | null;
  driveIntegration: Integration | null;
  driveError: string | null;
  slackIntegration: SlackIntegration | null;
  slackError: string | null;
  slackChannels: SlackChannel[];
  slackChannelsError: string | null;
  mdmOverview: MdmOverview | null;
  mdmError: string | null;
  nrConnected: boolean;
  nrStatus: NewRelicStatus | null;
  nrError: string | null;
  repos: GitHubRepo[];
}

export function useCoreIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'core'] as const,
    queryFn: async (): Promise<CoreIntegrationsData> => {
      const [intRes, slackRes, channelsRes, mdmRes, nrRes] =
        await Promise.allSettled([
          integrationsService.getStatus(),
          slackService.getStatus(),
          slackService.getChannels(),
          mdmService.getOverview(),
          newRelicService.getStatus(),
        ]);

      const integrations = settled(intRes);
      const gh =
        integrations?.integrations.find(
          (i) => i.provider === 'GITHUB' && i.status === 'ACTIVE',
        ) ?? null;
      const drive =
        integrations?.integrations.find(
          (i) => i.provider === 'GOOGLE_DRIVE' && i.status === 'ACTIVE',
        ) ?? null;

      const slack = settled(slackRes);
      const channels = settled(channelsRes);
      const mdm = settled(mdmRes);
      const nr = settled(nrRes);

      return {
        githubIntegration: gh,
        githubError: intRes.status === 'rejected' ? settledError(intRes) : null,
        driveIntegration: drive,
        driveError: intRes.status === 'rejected' ? settledError(intRes) : null,
        slackIntegration: slack?.data ?? null,
        slackError: settledError(slackRes),
        slackChannels: channels?.data ?? [],
        slackChannelsError: settledError(channelsRes),
        mdmOverview: mdm ?? null,
        mdmError: settledError(mdmRes),
        nrConnected: nr?.connected ?? false,
        nrStatus: nr?.data ?? null,
        nrError: settledError(nrRes),
        repos: gh?.repos ?? [],
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 2 — Productivity: Notion / BambooHR / Redash / Google Workspace
// ---------------------------------------------------------------------------

export interface ProductivityIntegrationsData {
  notionConnected: boolean;
  notionStatus: NotionStatus | null;
  notionError: string | null;
  bamboohrAccounts: HRIntegrationRecord[];
  bamboohrError: string | null;
  redashAccounts: RedashIntegrationRecord[];
  redashError: string | null;
  workspaceAccounts: WorkspaceIntegrationRecord[];
  workspaceError: string | null;
}

export function useProductivityIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'productivity'] as const,
    queryFn: async (): Promise<ProductivityIntegrationsData> => {
      const [notionRes, bambooRes, redashRes, workspaceRes] =
        await Promise.allSettled([
          notionService.getStatus(),
          bamboohrService.getAccounts(),
          redashService.getAccounts(),
          workspaceService.getAccounts(),
        ]);

      const notion = settled(notionRes);
      const bamboo = settled(bambooRes);
      const redash = settled(redashRes);
      const workspace = settled(workspaceRes);

      return {
        notionConnected: notion?.connected ?? false,
        notionStatus: notion?.data ?? null,
        notionError: settledError(notionRes),
        bamboohrAccounts: bamboo?.data ?? [],
        bamboohrError: settledError(bambooRes),
        redashAccounts: redash?.data ?? [],
        redashError: settledError(redashRes),
        workspaceAccounts: workspace?.data ?? [],
        workspaceError: settledError(workspaceRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 3 — Cloud: AWS / Cloudflare / GCP / Azure
// ---------------------------------------------------------------------------

export interface CloudIntegrationsData {
  awsAccounts: AwsAccountRecord[];
  awsError: string | null;
  cloudflareAccounts: CloudflareAccountRecord[];
  cloudflareError: string | null;
  gcpAccounts: GcpIntegrationRecord[];
  gcpError: string | null;
  azureAccounts: AzureIntegrationRecord[];
  azureError: string | null;
}

export function useCloudIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'cloud'] as const,
    queryFn: async (): Promise<CloudIntegrationsData> => {
      const [awsRes, cfRes, gcpRes, azureRes] = await Promise.allSettled([
        awsService.getAccounts(),
        cloudflareService.getAccounts(),
        gcpService.getAccounts(),
        azureService.getAccounts(),
      ]);

      return {
        awsAccounts: settled(awsRes)?.data ?? [],
        awsError: settledError(awsRes),
        cloudflareAccounts: settled(cfRes)?.data ?? [],
        cloudflareError: settledError(cfRes),
        gcpAccounts: settled(gcpRes)?.data ?? [],
        gcpError: settledError(gcpRes),
        azureAccounts: settled(azureRes)?.data ?? [],
        azureError: settledError(azureRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 4 — Observability & Incidents: Fleet / Intercom / PagerDuty / Opsgenie /
//          ServiceNow / Datadog / New Relic (status only — fetched in core)
// ---------------------------------------------------------------------------

export interface ObservabilityIntegrationsData {
  fleetAccounts: FleetIntegrationRecord[];
  fleetError: string | null;
  intercomAccounts: IntercomIntegrationRecord[];
  intercomError: string | null;
  pagerdutyAccounts: PagerDutyIntegrationRecord[];
  pagerdutyError: string | null;
  opsgenieAccounts: OpsgenieIntegrationRecord[];
  opsgenieError: string | null;
  servicenowAccounts: ServiceNowIntegrationRecord[];
  servicenowError: string | null;
  datadogAccounts: DatadogIntegrationRecord[];
  datadogError: string | null;
}

export function useObservabilityIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'observability'] as const,
    queryFn: async (): Promise<ObservabilityIntegrationsData> => {
      const [fleetRes, intercomRes, pdRes, ogRes, snRes, ddRes] =
        await Promise.allSettled([
          fleetService.getAccounts(),
          intercomService.getAccounts(),
          pagerdutyService.getAccounts(),
          opsgenieService.getAccounts(),
          servicenowIncidentService.getAccounts(),
          datadogIncidentsService.getAccounts(),
        ]);

      return {
        fleetAccounts: settled(fleetRes)?.data ?? [],
        fleetError: settledError(fleetRes),
        intercomAccounts: settled(intercomRes)?.data ?? [],
        intercomError: settledError(intercomRes),
        pagerdutyAccounts: settled(pdRes)?.data ?? [],
        pagerdutyError: settledError(pdRes),
        opsgenieAccounts: settled(ogRes)?.data ?? [],
        opsgenieError: settledError(ogRes),
        servicenowAccounts: settled(snRes)?.data ?? [],
        servicenowError: settledError(snRes),
        datadogAccounts: settled(ddRes)?.data ?? [],
        datadogError: settledError(ddRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 5 — Security scanning: Wiz / Lacework / Snyk / SonarQube / Veracode /
//          Checkmarx / BigID
// ---------------------------------------------------------------------------

export interface SecurityScanningIntegrationsData {
  wizAccounts: WizIntegrationRecord[];
  wizError: string | null;
  laceworkAccounts: LaceworkIntegrationRecord[];
  laceworkError: string | null;
  snykAccounts: SnykIntegrationRecord[];
  snykError: string | null;
  sonarqubeAccounts: SonarQubeIntegrationRecord[];
  sonarqubeError: string | null;
  veracodeAccounts: VeracodeIntegrationRecord[];
  veracodeError: string | null;
  checkmarxAccounts: CheckmarxIntegrationRecord[];
  checkmarxError: string | null;
  bigIdAccounts: BigIdIntegrationRecord[];
  bigIdError: string | null;
}

export function useSecurityScanningIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'security-scanning'] as const,
    queryFn: async (): Promise<SecurityScanningIntegrationsData> => {
      const [wizRes, laceworkRes, snykRes, sonarqubeRes, veracodeRes, checkmarxRes, bigIdRes] =
        await Promise.allSettled([
          wizService.getAccounts(),
          laceworkService.getAccounts(),
          snykService.getAccounts(),
          sonarqubeService.getAccounts(),
          veracodeService.getAccounts(),
          checkmarxService.getAccounts(),
          bigIdService.getAccounts(),
        ]);

      return {
        wizAccounts: settled(wizRes)?.data ?? [],
        wizError: settledError(wizRes),
        laceworkAccounts: settled(laceworkRes)?.data ?? [],
        laceworkError: settledError(laceworkRes),
        snykAccounts: settled(snykRes)?.data ?? [],
        snykError: settledError(snykRes),
        sonarqubeAccounts: settled(sonarqubeRes)?.data ?? [],
        sonarqubeError: settledError(sonarqubeRes),
        veracodeAccounts: settled(veracodeRes)?.data ?? [],
        veracodeError: settledError(veracodeRes),
        checkmarxAccounts: settled(checkmarxRes)?.data ?? [],
        checkmarxError: settledError(checkmarxRes),
        bigIdAccounts: settled(bigIdRes)?.data ?? [],
        bigIdError: settledError(bigIdRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 6 — Secrets & Certificates: Vault / SecretsManager / CertManager
// ---------------------------------------------------------------------------

export interface SecretsIntegrationsData {
  vaultAccounts: VaultIntegrationRecord[];
  vaultError: string | null;
  secretsManagerAccounts: SecretsManagerIntegrationRecord[];
  secretsManagerError: string | null;
  certManagerAccounts: CertManagerIntegrationRecord[];
  certManagerError: string | null;
}

export function useSecretsIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'secrets'] as const,
    queryFn: async (): Promise<SecretsIntegrationsData> => {
      const [vaultRes, secretsManagerRes, certManagerRes] =
        await Promise.allSettled([
          vaultService.getAccounts(),
          secretsManagerService.getAccounts(),
          certManagerService.getAccounts(),
        ]);

      return {
        vaultAccounts: settled(vaultRes)?.data ?? [],
        vaultError: settledError(vaultRes),
        secretsManagerAccounts: settled(secretsManagerRes)?.data ?? [],
        secretsManagerError: settledError(secretsManagerRes),
        certManagerAccounts: settled(certManagerRes)?.data ?? [],
        certManagerError: settledError(certManagerRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}

// ---------------------------------------------------------------------------
// Tab 7 — Identity: Okta / Azure AD / JumpCloud
// ---------------------------------------------------------------------------

export interface IdentityIntegrationsData {
  oktaAccounts: OktaIntegrationRecord[];
  oktaError: string | null;
  azureAdAccounts: AzureAdIntegrationRecord[];
  azureAdError: string | null;
  jumpCloudAccounts: JumpCloudIntegrationRecord[];
  jumpCloudError: string | null;
}

export function useIdentityIntegrations(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'identity'] as const,
    queryFn: async (): Promise<IdentityIntegrationsData> => {
      const [oktaRes, azureAdRes, jumpCloudRes] = await Promise.allSettled([
        oktaService.getAccounts(),
        azureAdService.getAccounts(),
        jumpCloudService.getAccounts(),
      ]);

      return {
        oktaAccounts: settled(oktaRes)?.data ?? [],
        oktaError: settledError(oktaRes),
        azureAdAccounts: settled(azureAdRes)?.data ?? [],
        azureAdError: settledError(azureAdRes),
        jumpCloudAccounts: settled(jumpCloudRes)?.data ?? [],
        jumpCloudError: settledError(jumpCloudRes),
      };
    },
    enabled,
    staleTime: 30_000,
  });
}
