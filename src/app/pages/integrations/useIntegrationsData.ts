/**
 * useIntegrationsData — backward-compatible adapter.
 *
 * Composes the per-category React Query hooks from useIntegrationTabData and
 * re-exports the same flat shape that IntegrationsPage expects. Local useState
 * setters are preserved so card components can still do optimistic updates
 * (e.g. add/remove an account without waiting for a refetch).
 *
 * Loading semantics:
 *   - `loading` is true while any of the 7 queries are still fetching for
 *     the first time. Subsequent background refetches do not re-trigger it.
 *   - `hasLoadedDeferred` stays true once all queries have settled at least
 *     once (mirrors the old flag the page uses to gate the Available tab).
 *   - `loadStatus` triggers a refetch of all 7 queries imperatively; kept for
 *     the initial mount call in IntegrationsPage's useEffect.
 *
 * All queries are enabled immediately on mount so the Connected tab populates
 * without the user needing to visit the Available tab first.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  type GitHubRepo,
  type Integration,
} from '@/services/api/integrations';
import { type MdmOverview } from '@/services/api/mdm';
import { type SlackChannel, type SlackIntegration } from '@/services/api/slack';
import { type NewRelicStatus } from '@/services/api/newrelic';
import { type NotionStatus } from '@/services/api/notion';
import { type AwsAccountRecord } from '@/services/api/aws';
import { type CloudflareAccountRecord } from '@/services/api/cloudflare';
import { type HRIntegrationRecord } from '@/services/api/bamboohr';
import { type RedashIntegrationRecord } from '@/services/api/redash';
import { type WorkspaceIntegrationRecord } from '@/services/api/workspace';
import { type FleetIntegrationRecord } from '@/services/api/fleet';
import { type IntercomIntegrationRecord } from '@/services/api/intercom';
import { type BigIdIntegrationRecord } from '@/services/api/bigid';
import { type PagerDutyIntegrationRecord } from '@/services/api/pagerduty';
import { type OpsgenieIntegrationRecord } from '@/services/api/opsgenie';
import { type ServiceNowIntegrationRecord } from '@/services/api/servicenow-incident';
import { type DatadogIntegrationRecord } from '@/services/api/datadog-incidents';
import { type GcpIntegrationRecord } from '@/services/api/gcp';
import { type AzureIntegrationRecord } from '@/services/api/azure';
import { type WizIntegrationRecord } from '@/services/api/wiz';
import { type LaceworkIntegrationRecord } from '@/services/api/lacework';
import { type SnykIntegrationRecord } from '@/services/api/snyk';
import { type SonarQubeIntegrationRecord } from '@/services/api/sonarqube';
import { type VeracodeIntegrationRecord } from '@/services/api/veracode';
import { type CheckmarxIntegrationRecord } from '@/services/api/checkmarx';
import { type VaultIntegrationRecord } from '@/services/api/vault';
import { type SecretsManagerIntegrationRecord } from '@/services/api/secretsmanager';
import { type CertManagerIntegrationRecord } from '@/services/api/certmanager';
import { type OktaIntegrationRecord } from '@/services/api/okta';
import { type AzureAdIntegrationRecord } from '@/services/api/azuread';
import { type JumpCloudIntegrationRecord } from '@/services/api/jumpcloud';

import {
  useCoreIntegrations,
  useProductivityIntegrations,
  useCloudIntegrations,
  useObservabilityIntegrations,
  useSecurityScanningIntegrations,
  useSecretsIntegrations,
  useIdentityIntegrations,
} from './useIntegrationTabData';

// ---------------------------------------------------------------------------
// Public interface types (unchanged from the original file)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIntegrationsData(): IntegrationsData &
  IntegrationsDataSetters & {
    loadStatus: () => Promise<void>;
    hasLoadedDeferred: boolean;
  } {
  const queryClient = useQueryClient();

  // All queries start enabled immediately — no more tab-gating at this layer.
  // IntegrationsPage's old "deferred" pattern is preserved via hasLoadedDeferred
  // for backward compatibility, but data will already be present by then.
  const coreQuery = useCoreIntegrations(true);
  const productivityQuery = useProductivityIntegrations(true);
  const cloudQuery = useCloudIntegrations(true);
  const observabilityQuery = useObservabilityIntegrations(true);
  const securityQuery = useSecurityScanningIntegrations(true);
  const secretsQuery = useSecretsIntegrations(true);
  const identityQuery = useIdentityIntegrations(true);

  // ── Derived loading flag ──────────────────────────────────────────────────
  // True only on the very first fetch of each query, not on background
  // refetches, so the UI skeleton doesn't flash on window-focus refetches.
  const loading =
    coreQuery.isLoading ||
    productivityQuery.isLoading ||
    cloudQuery.isLoading ||
    observabilityQuery.isLoading ||
    securityQuery.isLoading ||
    secretsQuery.isLoading ||
    identityQuery.isLoading;

  // hasLoadedDeferred becomes true once every query has settled at least once.
  const hasLoadedDeferred =
    !coreQuery.isLoading &&
    !productivityQuery.isLoading &&
    !cloudQuery.isLoading &&
    !observabilityQuery.isLoading &&
    !securityQuery.isLoading &&
    !secretsQuery.isLoading &&
    !identityQuery.isLoading;

  // ── Local override state ──────────────────────────────────────────────────
  // Cards do optimistic updates (add/remove an account, disconnect, etc.) via
  // these setters. They start as undefined and are seeded from query data on
  // the first successful fetch, after which card mutations take over.

  const [githubIntegration, setGithubIntegration] = useState<Integration | null>(null);
  const [driveIntegration, setDriveIntegration] = useState<Integration | null>(null);
  const [slackIntegration, setSlackIntegration] = useState<SlackIntegration | null>(null);
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([]);
  const [nrConnected, setNrConnected] = useState(false);
  const [nrStatus, setNrStatus] = useState<NewRelicStatus | null>(null);
  const [notionConnected, setNotionConnected] = useState(false);
  const [notionStatus, setNotionStatus] = useState<NotionStatus | null>(null);
  const [awsAccounts, setAwsAccounts] = useState<AwsAccountRecord[]>([]);
  const [cloudflareAccounts, setCloudflareAccounts] = useState<CloudflareAccountRecord[]>([]);
  const [bamboohrAccounts, setBamboohrAccounts] = useState<HRIntegrationRecord[]>([]);
  const [redashAccounts, setRedashAccounts] = useState<RedashIntegrationRecord[]>([]);
  const [workspaceAccounts, setWorkspaceAccounts] = useState<WorkspaceIntegrationRecord[]>([]);
  const [fleetAccounts, setFleetAccounts] = useState<FleetIntegrationRecord[]>([]);
  const [intercomAccounts, setIntercomAccounts] = useState<IntercomIntegrationRecord[]>([]);
  const [bigIdAccounts, setBigIdAccounts] = useState<BigIdIntegrationRecord[]>([]);
  const [pagerdutyAccounts, setPagerdutyAccounts] = useState<PagerDutyIntegrationRecord[]>([]);
  const [opsgenieAccounts, setOpsgenieAccounts] = useState<OpsgenieIntegrationRecord[]>([]);
  const [servicenowAccounts, setServicenowAccounts] = useState<ServiceNowIntegrationRecord[]>([]);
  const [datadogAccounts, setDatadogAccounts] = useState<DatadogIntegrationRecord[]>([]);
  const [gcpAccounts, setGcpAccounts] = useState<GcpIntegrationRecord[]>([]);
  const [azureAccounts, setAzureAccounts] = useState<AzureIntegrationRecord[]>([]);
  const [wizAccounts, setWizAccounts] = useState<WizIntegrationRecord[]>([]);
  const [laceworkAccounts, setLaceworkAccounts] = useState<LaceworkIntegrationRecord[]>([]);
  const [snykAccounts, setSnykAccounts] = useState<SnykIntegrationRecord[]>([]);
  const [sonarqubeAccounts, setSonarqubeAccounts] = useState<SonarQubeIntegrationRecord[]>([]);
  const [veracodeAccounts, setVeracodeAccounts] = useState<VeracodeIntegrationRecord[]>([]);
  const [checkmarxAccounts, setCheckmarxAccounts] = useState<CheckmarxIntegrationRecord[]>([]);
  const [vaultAccounts, setVaultAccounts] = useState<VaultIntegrationRecord[]>([]);
  const [secretsManagerAccounts, setSecretsManagerAccounts] = useState<SecretsManagerIntegrationRecord[]>([]);
  const [certManagerAccounts, setCertManagerAccounts] = useState<CertManagerIntegrationRecord[]>([]);
  const [oktaAccounts, setOktaAccounts] = useState<OktaIntegrationRecord[]>([]);
  const [azureAdAccounts, setAzureAdAccounts] = useState<AzureAdIntegrationRecord[]>([]);
  const [jumpCloudAccounts, setJumpCloudAccounts] = useState<JumpCloudIntegrationRecord[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [mdmOverview, setMdmOverview] = useState<MdmOverview | null>(null);

  // ── Seed local state from query results ──────────────────────────────────
  // Use refs to track whether we've seeded from a given query so we don't
  // overwrite card-driven optimistic updates on every render.
  const seededCore = useRef(false);
  const seededProductivity = useRef(false);
  const seededCloud = useRef(false);
  const seededObservability = useRef(false);
  const seededSecurity = useRef(false);
  const seededSecrets = useRef(false);
  const seededIdentity = useRef(false);

  useEffect(() => {
    if (coreQuery.data && !seededCore.current) {
      seededCore.current = true;
      const d = coreQuery.data;
      setGithubIntegration(d.githubIntegration);
      setDriveIntegration(d.driveIntegration);
      setSlackIntegration(d.slackIntegration);
      setSlackChannels(d.slackChannels);
      setNrConnected(d.nrConnected);
      setNrStatus(d.nrStatus);
      setRepos(d.repos);
      if (d.mdmOverview) setMdmOverview(d.mdmOverview);
    }
  }, [coreQuery.data]);

  useEffect(() => {
    if (productivityQuery.data && !seededProductivity.current) {
      seededProductivity.current = true;
      const d = productivityQuery.data;
      setNotionConnected(d.notionConnected);
      setNotionStatus(d.notionStatus);
      setBamboohrAccounts(d.bamboohrAccounts);
      setRedashAccounts(d.redashAccounts);
      setWorkspaceAccounts(d.workspaceAccounts);
    }
  }, [productivityQuery.data]);

  useEffect(() => {
    if (cloudQuery.data && !seededCloud.current) {
      seededCloud.current = true;
      const d = cloudQuery.data;
      setAwsAccounts(d.awsAccounts);
      setCloudflareAccounts(d.cloudflareAccounts);
      setGcpAccounts(d.gcpAccounts);
      setAzureAccounts(d.azureAccounts);
    }
  }, [cloudQuery.data]);

  useEffect(() => {
    if (observabilityQuery.data && !seededObservability.current) {
      seededObservability.current = true;
      const d = observabilityQuery.data;
      setFleetAccounts(d.fleetAccounts);
      setIntercomAccounts(d.intercomAccounts);
      setPagerdutyAccounts(d.pagerdutyAccounts);
      setOpsgenieAccounts(d.opsgenieAccounts);
      setServicenowAccounts(d.servicenowAccounts);
      setDatadogAccounts(d.datadogAccounts);
    }
  }, [observabilityQuery.data]);

  useEffect(() => {
    if (securityQuery.data && !seededSecurity.current) {
      seededSecurity.current = true;
      const d = securityQuery.data;
      setWizAccounts(d.wizAccounts);
      setLaceworkAccounts(d.laceworkAccounts);
      setSnykAccounts(d.snykAccounts);
      setSonarqubeAccounts(d.sonarqubeAccounts);
      setVeracodeAccounts(d.veracodeAccounts);
      setCheckmarxAccounts(d.checkmarxAccounts);
      setBigIdAccounts(d.bigIdAccounts);
    }
  }, [securityQuery.data]);

  useEffect(() => {
    if (secretsQuery.data && !seededSecrets.current) {
      seededSecrets.current = true;
      const d = secretsQuery.data;
      setVaultAccounts(d.vaultAccounts);
      setSecretsManagerAccounts(d.secretsManagerAccounts);
      setCertManagerAccounts(d.certManagerAccounts);
    }
  }, [secretsQuery.data]);

  useEffect(() => {
    if (identityQuery.data && !seededIdentity.current) {
      seededIdentity.current = true;
      const d = identityQuery.data;
      setOktaAccounts(d.oktaAccounts);
      setAzureAdAccounts(d.azureAdAccounts);
      setJumpCloudAccounts(d.jumpCloudAccounts);
    }
  }, [identityQuery.data]);

  // ── MDM: fetched as part of coreQuery but kept in separate state so it can
  //   be updated independently if needed.
  useEffect(() => {
    if (coreQuery.data?.mdmOverview) {
      setMdmOverview(coreQuery.data.mdmOverview);
    }
  }, [coreQuery.data?.mdmOverview]);

  // ── loadStatus: invalidate all integration queries to trigger a fresh fetch.
  //   Called by IntegrationsPage on mount and on tab change (legacy behaviour).
  const loadStatus = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['integrations'] });
    // Reset seed flags so local state re-syncs from the fresh query results.
    seededCore.current = false;
    seededProductivity.current = false;
    seededCloud.current = false;
    seededObservability.current = false;
    seededSecurity.current = false;
    seededSecrets.current = false;
    seededIdentity.current = false;
  }, [queryClient]);

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
