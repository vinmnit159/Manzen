import { useState, useCallback } from 'react';
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
import { awsService, AwsAccountRecord } from '@/services/api/aws';
import {
  cloudflareService,
  CloudflareAccountRecord,
} from '@/services/api/cloudflare';
import { bamboohrService, HRIntegrationRecord } from '@/services/api/bamboohr';
import { redashService, RedashIntegrationRecord } from '@/services/api/redash';
import {
  workspaceService,
  WorkspaceIntegrationRecord,
} from '@/services/api/workspace';
import { fleetService, FleetIntegrationRecord } from '@/services/api/fleet';
import {
  intercomService,
  IntercomIntegrationRecord,
} from '@/services/api/intercom';
import { bigIdService, BigIdIntegrationRecord } from '@/services/api/bigid';
import {
  pagerdutyService,
  PagerDutyIntegrationRecord,
} from '@/services/api/pagerduty';
import {
  opsgenieService,
  OpsgenieIntegrationRecord,
} from '@/services/api/opsgenie';
import {
  servicenowIncidentService,
  ServiceNowIntegrationRecord,
} from '@/services/api/servicenow-incident';
import {
  datadogIncidentsService,
  DatadogIntegrationRecord,
} from '@/services/api/datadog-incidents';
import { gcpService, GcpIntegrationRecord } from '@/services/api/gcp';
import { azureService, AzureIntegrationRecord } from '@/services/api/azure';
import { wizService, WizIntegrationRecord } from '@/services/api/wiz';
import {
  laceworkService,
  LaceworkIntegrationRecord,
} from '@/services/api/lacework';
import { snykService, SnykIntegrationRecord } from '@/services/api/snyk';
import {
  sonarqubeService,
  SonarQubeIntegrationRecord,
} from '@/services/api/sonarqube';
import {
  veracodeService,
  VeracodeIntegrationRecord,
} from '@/services/api/veracode';
import {
  checkmarxService,
  CheckmarxIntegrationRecord,
} from '@/services/api/checkmarx';
import { vaultService, VaultIntegrationRecord } from '@/services/api/vault';
import {
  secretsManagerService,
  SecretsManagerIntegrationRecord,
} from '@/services/api/secretsmanager';
import {
  certManagerService,
  CertManagerIntegrationRecord,
} from '@/services/api/certmanager';
import { oktaService, OktaIntegrationRecord } from '@/services/api/okta';
import {
  azureAdService,
  AzureAdIntegrationRecord,
} from '@/services/api/azuread';
import {
  jumpCloudService,
  JumpCloudIntegrationRecord,
} from '@/services/api/jumpcloud';

export interface IntegrationsData {
  githubIntegration: Integration | null;
  driveIntegration: Integration | null;
  slackIntegration: SlackIntegration | null;
  slackChannels: SlackChannel[];
  nrConnected: boolean;
  nrStatus: NewRelicStatus | null;
  notionConnected: boolean;
  notionStatus: NotionStatus | null;
  awsAccounts: AwsAccountRecord[];
  cloudflareAccounts: CloudflareAccountRecord[];
  bamboohrAccounts: HRIntegrationRecord[];
  redashAccounts: RedashIntegrationRecord[];
  workspaceAccounts: WorkspaceIntegrationRecord[];
  fleetAccounts: FleetIntegrationRecord[];
  intercomAccounts: IntercomIntegrationRecord[];
  bigIdAccounts: BigIdIntegrationRecord[];
  pagerdutyAccounts: PagerDutyIntegrationRecord[];
  opsgenieAccounts: OpsgenieIntegrationRecord[];
  servicenowAccounts: ServiceNowIntegrationRecord[];
  datadogAccounts: DatadogIntegrationRecord[];
  gcpAccounts: GcpIntegrationRecord[];
  azureAccounts: AzureIntegrationRecord[];
  wizAccounts: WizIntegrationRecord[];
  laceworkAccounts: LaceworkIntegrationRecord[];
  snykAccounts: SnykIntegrationRecord[];
  sonarqubeAccounts: SonarQubeIntegrationRecord[];
  veracodeAccounts: VeracodeIntegrationRecord[];
  checkmarxAccounts: CheckmarxIntegrationRecord[];
  vaultAccounts: VaultIntegrationRecord[];
  secretsManagerAccounts: SecretsManagerIntegrationRecord[];
  certManagerAccounts: CertManagerIntegrationRecord[];
  oktaAccounts: OktaIntegrationRecord[];
  azureAdAccounts: AzureAdIntegrationRecord[];
  jumpCloudAccounts: JumpCloudIntegrationRecord[];
  repos: GitHubRepo[];
  mdmOverview: MdmOverview | null;
  loading: boolean;
}

export interface IntegrationsDataSetters {
  setGithubIntegration: (v: Integration | null) => void;
  setDriveIntegration: (v: Integration | null) => void;
  setSlackIntegration: (v: SlackIntegration | null) => void;
  setSlackChannels: (v: SlackChannel[]) => void;
  setNrConnected: (v: boolean) => void;
  setNrStatus: (v: NewRelicStatus | null) => void;
  setNotionConnected: (v: boolean) => void;
  setNotionStatus: (v: NotionStatus | null) => void;
  setAwsAccounts: React.Dispatch<React.SetStateAction<AwsAccountRecord[]>>;
  setCloudflareAccounts: React.Dispatch<
    React.SetStateAction<CloudflareAccountRecord[]>
  >;
  setBamboohrAccounts: React.Dispatch<
    React.SetStateAction<HRIntegrationRecord[]>
  >;
  setRedashAccounts: React.Dispatch<
    React.SetStateAction<RedashIntegrationRecord[]>
  >;
  setWorkspaceAccounts: React.Dispatch<
    React.SetStateAction<WorkspaceIntegrationRecord[]>
  >;
  setFleetAccounts: React.Dispatch<
    React.SetStateAction<FleetIntegrationRecord[]>
  >;
  setIntercomAccounts: React.Dispatch<
    React.SetStateAction<IntercomIntegrationRecord[]>
  >;
  setBigIdAccounts: React.Dispatch<
    React.SetStateAction<BigIdIntegrationRecord[]>
  >;
  setPagerdutyAccounts: React.Dispatch<
    React.SetStateAction<PagerDutyIntegrationRecord[]>
  >;
  setOpsgenieAccounts: React.Dispatch<
    React.SetStateAction<OpsgenieIntegrationRecord[]>
  >;
  setServicenowAccounts: React.Dispatch<
    React.SetStateAction<ServiceNowIntegrationRecord[]>
  >;
  setDatadogAccounts: React.Dispatch<
    React.SetStateAction<DatadogIntegrationRecord[]>
  >;
  setGcpAccounts: React.Dispatch<React.SetStateAction<GcpIntegrationRecord[]>>;
  setAzureAccounts: React.Dispatch<
    React.SetStateAction<AzureIntegrationRecord[]>
  >;
  setWizAccounts: React.Dispatch<React.SetStateAction<WizIntegrationRecord[]>>;
  setLaceworkAccounts: React.Dispatch<
    React.SetStateAction<LaceworkIntegrationRecord[]>
  >;
  setSnykAccounts: React.Dispatch<
    React.SetStateAction<SnykIntegrationRecord[]>
  >;
  setSonarqubeAccounts: React.Dispatch<
    React.SetStateAction<SonarQubeIntegrationRecord[]>
  >;
  setVeracodeAccounts: React.Dispatch<
    React.SetStateAction<VeracodeIntegrationRecord[]>
  >;
  setCheckmarxAccounts: React.Dispatch<
    React.SetStateAction<CheckmarxIntegrationRecord[]>
  >;
  setVaultAccounts: React.Dispatch<
    React.SetStateAction<VaultIntegrationRecord[]>
  >;
  setSecretsManagerAccounts: React.Dispatch<
    React.SetStateAction<SecretsManagerIntegrationRecord[]>
  >;
  setCertManagerAccounts: React.Dispatch<
    React.SetStateAction<CertManagerIntegrationRecord[]>
  >;
  setOktaAccounts: React.Dispatch<
    React.SetStateAction<OktaIntegrationRecord[]>
  >;
  setAzureAdAccounts: React.Dispatch<
    React.SetStateAction<AzureAdIntegrationRecord[]>
  >;
  setJumpCloudAccounts: React.Dispatch<
    React.SetStateAction<JumpCloudIntegrationRecord[]>
  >;
  setRepos: (v: GitHubRepo[]) => void;
}

// React import needed for Dispatch type
import React from 'react';

export function useIntegrationsData(): IntegrationsData &
  IntegrationsDataSetters & {
    loadStatus: () => Promise<void>;
    hasLoadedDeferred: boolean;
  } {
  const [githubIntegration, setGithubIntegration] =
    useState<Integration | null>(null);
  const [driveIntegration, setDriveIntegration] = useState<Integration | null>(
    null,
  );
  const [slackIntegration, setSlackIntegration] =
    useState<SlackIntegration | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [nrConnected, setNrConnected] = useState(false);
  const [nrStatus, setNrStatus] = useState<NewRelicStatus | null>(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [awsAccounts, setAwsAccounts] = useState<AwsAccountRecord[]>([]);
  const [cloudflareAccounts, setCloudflareAccounts] = useState<
    CloudflareAccountRecord[]
  >([]);
  const [bamboohrAccounts, setBamboohrAccounts] = useState<
    HRIntegrationRecord[]
  >([]);
  const [redashAccounts, setRedashAccounts] = useState<
    RedashIntegrationRecord[]
  >([]);
  const [workspaceAccounts, setWorkspaceAccounts] = useState<
    WorkspaceIntegrationRecord[]
  >([]);
  const [fleetAccounts, setFleetAccounts] = useState<FleetIntegrationRecord[]>(
    [],
  );
  const [intercomAccounts, setIntercomAccounts] = useState<
    IntercomIntegrationRecord[]
  >([]);
  const [bigIdAccounts, setBigIdAccounts] = useState<BigIdIntegrationRecord[]>(
    [],
  );
  const [pagerdutyAccounts, setPagerdutyAccounts] = useState<
    PagerDutyIntegrationRecord[]
  >([]);
  const [opsgenieAccounts, setOpsgenieAccounts] = useState<
    OpsgenieIntegrationRecord[]
  >([]);
  const [servicenowAccounts, setServicenowAccounts] = useState<
    ServiceNowIntegrationRecord[]
  >([]);
  const [datadogAccounts, setDatadogAccounts] = useState<
    DatadogIntegrationRecord[]
  >([]);
  const [gcpAccounts, setGcpAccounts] = useState<GcpIntegrationRecord[]>([]);
  const [azureAccounts, setAzureAccounts] = useState<AzureIntegrationRecord[]>(
    [],
  );
  const [wizAccounts, setWizAccounts] = useState<WizIntegrationRecord[]>([]);
  const [laceworkAccounts, setLaceworkAccounts] = useState<
    LaceworkIntegrationRecord[]
  >([]);
  const [snykAccounts, setSnykAccounts] = useState<SnykIntegrationRecord[]>([]);
  const [sonarqubeAccounts, setSonarqubeAccounts] = useState<
    SonarQubeIntegrationRecord[]
  >([]);
  const [veracodeAccounts, setVeracodeAccounts] = useState<
    VeracodeIntegrationRecord[]
  >([]);
  const [checkmarxAccounts, setCheckmarxAccounts] = useState<
    CheckmarxIntegrationRecord[]
  >([]);
  const [vaultAccounts, setVaultAccounts] = useState<VaultIntegrationRecord[]>(
    [],
  );
  const [secretsManagerAccounts, setSecretsManagerAccounts] = useState<
    SecretsManagerIntegrationRecord[]
  >([]);
  const [certManagerAccounts, setCertManagerAccounts] = useState<
    CertManagerIntegrationRecord[]
  >([]);
  const [oktaAccounts, setOktaAccounts] = useState<OktaIntegrationRecord[]>([]);
  const [azureAdAccounts, setAzureAdAccounts] = useState<
    AzureAdIntegrationRecord[]
  >([]);
  const [jumpCloudAccounts, setJumpCloudAccounts] = useState<
    JumpCloudIntegrationRecord[]
  >([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [mdmOverview, setMdmOverview] = useState<MdmOverview | null>(null);
  const [loading, setLoading] = useState(true);
  // F3: track whether the deferred batches (3–7) have already been fetched.
  // Prevents re-fetching when the user switches back to the Available tab.
  const [hasLoadedDeferred, setHasLoadedDeferred] = useState(false);

  const loadStatus = useCallback(async () => {
    // Fire requests in named batches of 5 (backend connection-pool limit).
    // Each batch's state is applied immediately after it resolves so the
    // Connected count updates progressively rather than waiting for all requests
    // to finish — eliminating the "stuck at 0" problem.
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

    try {
      // ── Batch 1: GitHub/Drive + Slack + MDM + NewRelic ────────────────────
      const [intRes, slackRes, channelsRes, mdmRes, nrRes] = await Promise.all([
        integrationsService.getStatus(),
        slackService.getStatus().catch(() => ({ success: false, data: null })),
        slackService
          .getChannels()
          .catch(() => ({ data: [] as SlackChannel[] })),
        mdmService.getOverview().catch(
          () =>
            ({
              total: 0,
              compliant: 0,
              nonCompliant: 0,
              unknown: 0,
            }) as MdmOverview,
        ),
        newRelicService
          .getStatus()
          .catch(() => ({ connected: false, data: null })),
      ]);
      const gh =
        intRes.integrations.find(
          (i) => i.provider === 'GITHUB' && i.status === 'ACTIVE',
        ) ?? null;
      const drive =
        intRes.integrations.find(
          (i) => i.provider === 'GOOGLE_DRIVE' && i.status === 'ACTIVE',
        ) ?? null;
      setGithubIntegration(gh);
      setDriveIntegration(drive);
      setSlackIntegration(slackRes.data);
      setSlackChannels(channelsRes.data ?? []);
      setMdmOverview(mdmRes);
      setNrConnected(nrRes.connected);
      setNrStatus(nrRes.data);
      if (gh) setRepos(gh.repos);

      await delay(80);

      // ── Batch 2: Notion + AWS + Cloudflare + BambooHR + Redash ───────────
      const [notionRes, awsRes, cfRes, bambooRes, redashRes] =
        await Promise.all([
          notionService
            .getStatus()
            .catch(() => ({ connected: false, data: null })),
          awsService
            .getAccounts()
            .catch(() => ({ success: true, data: [] as AwsAccountRecord[] })),
          cloudflareService.getAccounts().catch(() => ({
            success: true,
            data: [] as CloudflareAccountRecord[],
          })),
          bamboohrService.getAccounts().catch(() => ({
            success: true,
            data: [] as HRIntegrationRecord[],
          })),
          redashService.getAccounts().catch(() => ({
            success: true,
            data: [] as RedashIntegrationRecord[],
          })),
        ]);
      setNotionConnected(notionRes.connected);
      setNotionStatus(notionRes.data);
      setAwsAccounts(awsRes.data ?? []);
      setCloudflareAccounts(cfRes.data ?? []);
      setBamboohrAccounts(bambooRes.data ?? []);
      setRedashAccounts(redashRes.data ?? []);

      await delay(80);

      // ── Batch 3: Workspace + Fleet + Intercom + BigId + PagerDuty ────────
      const [workspaceRes, fleetRes, intercomRes, bigIdRes, pdRes] =
        await Promise.all([
          workspaceService.getAccounts().catch(() => ({
            success: true,
            data: [] as WorkspaceIntegrationRecord[],
          })),
          fleetService.getAccounts().catch(() => ({
            success: true,
            data: [] as FleetIntegrationRecord[],
          })),
          intercomService.getAccounts().catch(() => ({
            success: true,
            data: [] as IntercomIntegrationRecord[],
          })),
          bigIdService.getAccounts().catch(() => ({
            success: true,
            data: [] as BigIdIntegrationRecord[],
          })),
          pagerdutyService.getAccounts().catch(() => ({
            success: true,
            data: [] as PagerDutyIntegrationRecord[],
          })),
        ]);
      setWorkspaceAccounts(workspaceRes.data ?? []);
      setFleetAccounts(fleetRes.data ?? []);
      setIntercomAccounts(intercomRes.data ?? []);
      setBigIdAccounts(bigIdRes.data ?? []);
      setPagerdutyAccounts(pdRes.data ?? []);

      await delay(80);

      // ── Batch 4: Opsgenie + ServiceNow + Datadog + GCP + Azure ───────────
      const [ogRes, snRes, ddRes, gcpRes, azureRes] = await Promise.all([
        opsgenieService.getAccounts().catch(() => ({
          success: true,
          data: [] as OpsgenieIntegrationRecord[],
        })),
        servicenowIncidentService.getAccounts().catch(() => ({
          success: true,
          data: [] as ServiceNowIntegrationRecord[],
        })),
        datadogIncidentsService.getAccounts().catch(() => ({
          success: true,
          data: [] as DatadogIntegrationRecord[],
        })),
        gcpService
          .getAccounts()
          .catch(() => ({ success: true, data: [] as GcpIntegrationRecord[] })),
        azureService.getAccounts().catch(() => ({
          success: true,
          data: [] as AzureIntegrationRecord[],
        })),
      ]);
      setOpsgenieAccounts(ogRes.data ?? []);
      setServicenowAccounts(snRes.data ?? []);
      setDatadogAccounts(ddRes.data ?? []);
      setGcpAccounts(gcpRes.data ?? []);
      setAzureAccounts(azureRes.data ?? []);

      await delay(80);

      // ── Batch 5: Wiz + Lacework + Snyk + SonarQube + Veracode ────────────
      const [wizRes, laceworkRes, snykRes, sonarqubeRes, veracodeRes] =
        await Promise.all([
          wizService.getAccounts().catch(() => ({
            success: true,
            data: [] as WizIntegrationRecord[],
          })),
          laceworkService.getAccounts().catch(() => ({
            success: true,
            data: [] as LaceworkIntegrationRecord[],
          })),
          snykService.getAccounts().catch(() => ({
            success: true,
            data: [] as SnykIntegrationRecord[],
          })),
          sonarqubeService.getAccounts().catch(() => ({
            success: true,
            data: [] as SonarQubeIntegrationRecord[],
          })),
          veracodeService.getAccounts().catch(() => ({
            success: true,
            data: [] as VeracodeIntegrationRecord[],
          })),
        ]);
      setWizAccounts(wizRes.data ?? []);
      setLaceworkAccounts(laceworkRes.data ?? []);
      setSnykAccounts(snykRes.data ?? []);
      setSonarqubeAccounts(sonarqubeRes.data ?? []);
      setVeracodeAccounts(veracodeRes.data ?? []);

      await delay(80);

      // ── Batch 6: Checkmarx + Vault + SecretsManager + CertManager + Okta ─
      const [
        checkmarxRes,
        vaultRes,
        secretsManagerRes,
        certManagerRes,
        oktaRes,
      ] = await Promise.all([
        checkmarxService.getAccounts().catch(() => ({
          success: true,
          data: [] as CheckmarxIntegrationRecord[],
        })),
        vaultService.getAccounts().catch(() => ({
          success: true,
          data: [] as VaultIntegrationRecord[],
        })),
        secretsManagerService.getAccounts().catch(() => ({
          success: true,
          data: [] as SecretsManagerIntegrationRecord[],
        })),
        certManagerService.getAccounts().catch(() => ({
          success: true,
          data: [] as CertManagerIntegrationRecord[],
        })),
        oktaService.getAccounts().catch(() => ({
          success: true,
          data: [] as OktaIntegrationRecord[],
        })),
      ]);
      setCheckmarxAccounts(checkmarxRes.data ?? []);
      setVaultAccounts(vaultRes.data ?? []);
      setSecretsManagerAccounts(secretsManagerRes.data ?? []);
      setCertManagerAccounts(certManagerRes.data ?? []);
      setOktaAccounts(oktaRes.data ?? []);

      await delay(80);

      // ── Batch 7: AzureAD + JumpCloud ─────────────────────────────────────
      const [azureAdRes, jumpCloudRes] = await Promise.all([
        azureAdService.getAccounts().catch(() => ({
          success: true,
          data: [] as AzureAdIntegrationRecord[],
        })),
        jumpCloudService.getAccounts().catch(() => ({
          success: true,
          data: [] as JumpCloudIntegrationRecord[],
        })),
      ]);
      setAzureAdAccounts(azureAdRes.data ?? []);
      setJumpCloudAccounts(jumpCloudRes.data ?? []);
    } catch {
      /* unauthenticated or network — treat as disconnected */
    } finally {
      setLoading(false);
      setHasLoadedDeferred(true);
    }
  }, []);

  return {
    hasLoadedDeferred,

    githubIntegration,
    setGithubIntegration,
    driveIntegration,
    setDriveIntegration,
    slackIntegration,
    setSlackIntegration,
    slackChannels,
    setSlackChannels,
    nrConnected,
    setNrConnected,
    nrStatus,
    setNrStatus,
    notionConnected,
    setNotionConnected,
    notionStatus,
    setNotionStatus,
    awsAccounts,
    setAwsAccounts,
    cloudflareAccounts,
    setCloudflareAccounts,
    bamboohrAccounts,
    setBamboohrAccounts,
    redashAccounts,
    setRedashAccounts,
    workspaceAccounts,
    setWorkspaceAccounts,
    fleetAccounts,
    setFleetAccounts,
    intercomAccounts,
    setIntercomAccounts,
    bigIdAccounts,
    setBigIdAccounts,
    pagerdutyAccounts,
    setPagerdutyAccounts,
    opsgenieAccounts,
    setOpsgenieAccounts,
    servicenowAccounts,
    setServicenowAccounts,
    datadogAccounts,
    setDatadogAccounts,
    gcpAccounts,
    setGcpAccounts,
    azureAccounts,
    setAzureAccounts,
    wizAccounts,
    setWizAccounts,
    laceworkAccounts,
    setLaceworkAccounts,
    snykAccounts,
    setSnykAccounts,
    sonarqubeAccounts,
    setSonarqubeAccounts,
    veracodeAccounts,
    setVeracodeAccounts,
    checkmarxAccounts,
    setCheckmarxAccounts,
    vaultAccounts,
    setVaultAccounts,
    secretsManagerAccounts,
    setSecretsManagerAccounts,
    certManagerAccounts,
    setCertManagerAccounts,
    oktaAccounts,
    setOktaAccounts,
    azureAdAccounts,
    setAzureAdAccounts,
    jumpCloudAccounts,
    setJumpCloudAccounts,
    repos,
    setRepos,
    mdmOverview,
    loading,
    loadStatus,
  };
}
