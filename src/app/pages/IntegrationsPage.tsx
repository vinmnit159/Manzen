import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageTemplate } from '@/app/components/PageTemplate';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import {
  AwsCard,
  AzureAdCard,
  AzureCard,
  BambooHRCard,
  BigIdCard,
  CertManagerCard,
  CheckmarxCard,
  CloudflareCard,
  DatadogIncidentsCard,
  EngineerAIntegrationCard,
  FleetCard,
  GcpCard,
  GitHubCard,
  GoogleDriveCard,
  IntercomCard,
  JumpCloudCard,
  LaceworkCard,
  MdmCard,
  NewRelicCard,
  NotionCard,
  OktaCard,
  OpsgenieCard,
  PagerDutyCard,
  RedashCard,
  RequestToolModal,
  SecretsManagerCard,
  ServiceNowIncidentCard,
  SlackCard,
  SnykCard,
  SonarQubeCard,
  STATIC_INTEGRATIONS,
  StaticIcon,
  VaultCard,
  VeracodeCard,
  WizCard,
  WorkspaceCard,
} from '@/app/pages/integrations/integrations';
import { useIntegrationsData } from '@/app/pages/integrations/useIntegrationsData';
import { ENGINEER_A_CARDS, workflowRuntimeConfigForEngineerACard } from '@/app/pages/integrations/engineerACards';

export function IntegrationsPage() {
  const [searchParams] = useSearchParams();

  const {
    githubIntegration, setGithubIntegration,
    driveIntegration, setDriveIntegration,
    slackIntegration, setSlackIntegration,
    slackChannels, setSlackChannels,
    nrConnected, setNrConnected,
    nrStatus, setNrStatus,
    notionConnected, setNotionConnected,
    notionStatus, setNotionStatus,
    awsAccounts, setAwsAccounts,
    cloudflareAccounts, setCloudflareAccounts,
    bamboohrAccounts, setBamboohrAccounts,
    redashAccounts, setRedashAccounts,
    workspaceAccounts, setWorkspaceAccounts,
    fleetAccounts, setFleetAccounts,
    intercomAccounts, setIntercomAccounts,
    bigIdAccounts, setBigIdAccounts,
    pagerdutyAccounts, setPagerdutyAccounts,
    opsgenieAccounts, setOpsgenieAccounts,
    servicenowAccounts, setServicenowAccounts,
    datadogAccounts, setDatadogAccounts,
    gcpAccounts, setGcpAccounts,
    azureAccounts, setAzureAccounts,
    wizAccounts, setWizAccounts,
    laceworkAccounts, setLaceworkAccounts,
    snykAccounts, setSnykAccounts,
    sonarqubeAccounts, setSonarqubeAccounts,
    veracodeAccounts, setVeracodeAccounts,
    checkmarxAccounts, setCheckmarxAccounts,
    vaultAccounts, setVaultAccounts,
    secretsManagerAccounts, setSecretsManagerAccounts,
    certManagerAccounts, setCertManagerAccounts,
    oktaAccounts, setOktaAccounts,
    azureAdAccounts, setAzureAdAccounts,
    jumpCloudAccounts, setJumpCloudAccounts,
    repos, setRepos,
    mdmOverview,
    loading,
    loadStatus,
  } = useIntegrationsData();

  const [activeTab, setActiveTab] = useState<'connected' | 'available'>('connected');
  const [showRequestToolModal, setShowRequestToolModal] = useState(false);
  const [engineerAConnectionCounts, setEngineerAConnectionCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Pagination for the "available" tab — render cards incrementally to avoid
  // mounting 100+ card components at once on initial page load.
  const PAGE_SIZE = 24;
  const [visibleEngineerACount, setVisibleEngineerACount] = useState(PAGE_SIZE);

  // Reset pagination when switching tabs
  const handleTabChange = useCallback((v: string) => {
    setActiveTab(v as 'connected' | 'available');
    setVisibleEngineerACount(PAGE_SIZE);
  }, []);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected === 'github') showToast('success', 'GitHub connected successfully!');
    if (connected === 'google_drive') showToast('success', 'Google Drive connected! Folder structure is being created.');
    if (connected === 'slack') showToast('success', 'Slack connected successfully!');
    const intercomConnected = searchParams.get('intercom');
    if (intercomConnected === 'connected') showToast('success', 'Intercom connected! 3 automated Policy tests are being seeded.');
    if (error) showToast('error', decodeURIComponent(error));
    loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  const isConnected = !!githubIntegration;
  const driveConnected = !!driveIntegration;
  const slackConnected = !!slackIntegration;

  // Memoize derived connection flags to avoid re-computing on every render
  const connectionFlags = useMemo(() => ({
    mdmConnected: (mdmOverview?.total ?? 0) > 0,
    awsConnected: awsAccounts.length > 0,
    cloudflareConnected: cloudflareAccounts.length > 0,
    bamboohrConnected: bamboohrAccounts.length > 0,
    redashConnected: redashAccounts.length > 0,
    workspaceConnected: workspaceAccounts.length > 0,
    fleetConnected: fleetAccounts.length > 0,
    intercomConnected: intercomAccounts.length > 0,
    bigIdConnected: bigIdAccounts.length > 0,
    pagerdutyConnected: pagerdutyAccounts.length > 0,
    opsgenieConnected: opsgenieAccounts.length > 0,
    servicenowConnected: servicenowAccounts.length > 0,
    datadogConnected: datadogAccounts.length > 0,
    gcpConnected: gcpAccounts.length > 0,
    azureConnected: azureAccounts.length > 0,
    wizConnected: wizAccounts.length > 0,
    laceworkConnected: laceworkAccounts.length > 0,
    snykConnected: snykAccounts.length > 0,
    sonarqubeConnected: sonarqubeAccounts.length > 0,
    veracodeConnected: veracodeAccounts.length > 0,
    checkmarxConnected: checkmarxAccounts.length > 0,
    vaultConnected: vaultAccounts.length > 0,
    secretsManagerConnected: secretsManagerAccounts.length > 0,
    certManagerConnected: certManagerAccounts.length > 0,
    oktaConnected: oktaAccounts.length > 0,
    azureAdConnected: azureAdAccounts.length > 0,
    jumpCloudConnected: jumpCloudAccounts.length > 0,
  }), [
    mdmOverview, awsAccounts, cloudflareAccounts, bamboohrAccounts, redashAccounts,
    workspaceAccounts, fleetAccounts, intercomAccounts, bigIdAccounts, pagerdutyAccounts,
    opsgenieAccounts, servicenowAccounts, datadogAccounts, gcpAccounts, azureAccounts,
    wizAccounts, laceworkAccounts, snykAccounts, sonarqubeAccounts, veracodeAccounts,
    checkmarxAccounts, vaultAccounts, secretsManagerAccounts, certManagerAccounts,
    oktaAccounts, azureAdAccounts, jumpCloudAccounts,
  ]);

  const {
    mdmConnected, awsConnected, cloudflareConnected, bamboohrConnected, redashConnected,
    workspaceConnected, fleetConnected, intercomConnected, bigIdConnected, pagerdutyConnected,
    opsgenieConnected, servicenowConnected, datadogConnected, gcpConnected, azureConnected,
    wizConnected, laceworkConnected, snykConnected, sonarqubeConnected, veracodeConnected,
    checkmarxConnected, vaultConnected, secretsManagerConnected, certManagerConnected,
    oktaConnected, azureAdConnected, jumpCloudConnected,
  } = connectionFlags;

  const baseConnectedCount = useMemo(() => [
    isConnected, driveConnected, slackConnected, nrConnected, notionConnected,
    mdmConnected, awsConnected, cloudflareConnected, bamboohrConnected, redashConnected,
    workspaceConnected, fleetConnected, intercomConnected, bigIdConnected, pagerdutyConnected,
    opsgenieConnected, servicenowConnected, datadogConnected, gcpConnected, azureConnected,
    wizConnected, laceworkConnected, snykConnected, sonarqubeConnected, veracodeConnected,
    checkmarxConnected, vaultConnected, secretsManagerConnected, certManagerConnected,
    oktaConnected, azureAdConnected, jumpCloudConnected,
  ].filter(Boolean).length, [
    isConnected, driveConnected, slackConnected, nrConnected, notionConnected,
    mdmConnected, awsConnected, cloudflareConnected, bamboohrConnected, redashConnected,
    workspaceConnected, fleetConnected, intercomConnected, bigIdConnected, pagerdutyConnected,
    opsgenieConnected, servicenowConnected, datadogConnected, gcpConnected, azureConnected,
    wizConnected, laceworkConnected, snykConnected, sonarqubeConnected, veracodeConnected,
    checkmarxConnected, vaultConnected, secretsManagerConnected, certManagerConnected,
    oktaConnected, azureAdConnected, jumpCloudConnected,
  ]);

  const engineerAConnectedCount = useMemo(
    () => Object.values(engineerAConnectionCounts).filter((count) => count > 0).length,
    [engineerAConnectionCounts],
  );
  const connectedCount = baseConnectedCount + engineerAConnectedCount;
  const totalToolCount = 32 + ENGINEER_A_CARDS.length + STATIC_INTEGRATIONS.length;
  const availableCount = Math.max(totalToolCount - connectedCount, 0);

  const shouldShowTile = useCallback(
    (connected: boolean) => (activeTab === 'connected' ? connected : !connected),
    [activeTab],
  );

  return (
    <PageTemplate title="Integrations" description="Connect third-party tools and services to your ISMS.">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm text-white transition-opacity ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="connected">
              Connected Tools&nbsp;
              {loading
                ? <span className="inline-block w-5 h-3.5 rounded bg-current opacity-20 animate-pulse align-middle" />
                : `(${connectedCount})`}
            </TabsTrigger>
            <TabsTrigger value="available">
              Available Tools&nbsp;
              {loading
                ? <span className="inline-block w-5 h-3.5 rounded bg-current opacity-20 animate-pulse align-middle" />
                : `(${availableCount})`}
            </TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRequestToolModal(true)}
            className="shrink-0 gap-1.5 text-xs"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Request a Tool
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* ── GitHub ────────────────────────────────────────────────────────── */}
        {shouldShowTile(isConnected) && <GitHubCard
          githubIntegration={githubIntegration}
          repos={repos}
          loading={loading}
          onDisconnect={() => {
            setGithubIntegration(null);
            setRepos([]);
          }}
          onToast={showToast}
        />}

        {/* ── Google Drive ──────────────────────────────────────────────────── */}
        {shouldShowTile(driveConnected) && <GoogleDriveCard
          driveIntegration={driveIntegration}
          loading={loading}
          onToast={showToast}
          onDisconnect={() => setDriveIntegration(null)}
        />}

        {/* ── Slack ────────────────────────────────────────────────────────── */}
        {shouldShowTile(slackConnected) && <SlackCard
          slackIntegration={slackIntegration}
          channels={slackChannels}
          loadingStatus={loading}
          onDisconnect={() => { setSlackIntegration(null); setSlackChannels([]); }}
          onChannelsChange={setSlackChannels}
          onToast={showToast}
        />}

        {/* ── Manzen MDM Agent ─────────────────────────────────────────────── */}
        {shouldShowTile(mdmConnected) && <MdmCard onToast={showToast} />}

        {/* ── BambooHR ─────────────────────────────────────────────────────── */}
        {shouldShowTile(bamboohrConnected) && <BambooHRCard
          accounts={bamboohrAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setBamboohrAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setBamboohrAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Notion ───────────────────────────────────────────────────────── */}
        {shouldShowTile(notionConnected) && <NotionCard
          notionStatus={notionStatus}
          connected={notionConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNotionConnected(true); setNotionStatus(status); }}
          onDisconnected={() => { setNotionConnected(false); setNotionStatus(null); }}
          onToast={showToast}
        />}

        {/* ── AWS ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(awsConnected) && <AwsCard
          accounts={awsAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAwsAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setAwsAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />}

        {/* ── Cloudflare ───────────────────────────────────────────────────── */}
        {shouldShowTile(cloudflareConnected) && <CloudflareCard
          accounts={cloudflareAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCloudflareAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(accountId) => setCloudflareAccounts(prev => prev.filter(a => a.id !== accountId))}
          onToast={showToast}
        />}

        {/* ── New Relic ────────────────────────────────────────────────────── */}
        {shouldShowTile(nrConnected) && <NewRelicCard
          nrStatus={nrStatus}
          connected={nrConnected}
          loadingStatus={loading}
          onConnected={(status) => { setNrConnected(true); setNrStatus(status); }}
          onDisconnected={() => { setNrConnected(false); setNrStatus(null); }}
          onToast={showToast}
        />}

        {/* ── Redash ───────────────────────────────────────────────────────── */}
        {shouldShowTile(redashConnected) && <RedashCard
          accounts={redashAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setRedashAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setRedashAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Google Workspace ─────────────────────────────────────────────── */}
        {shouldShowTile(workspaceConnected) && <WorkspaceCard
          accounts={workspaceAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setWorkspaceAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setWorkspaceAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Fleet ────────────────────────────────────────────────────────── */}
        {shouldShowTile(fleetConnected) && <FleetCard
          accounts={fleetAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setFleetAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setFleetAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Intercom ──────────────────────────────────────────────────────── */}
        {shouldShowTile(intercomConnected) && <IntercomCard
          accounts={intercomAccounts}
          loadingStatus={loading}
          onAccountRemoved={(id) => setIntercomAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── BigID ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(bigIdConnected) && <BigIdCard
          accounts={bigIdAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setBigIdAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setBigIdAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── PagerDuty ─────────────────────────────────────────────────────── */}
        {shouldShowTile(pagerdutyConnected) && <PagerDutyCard
          accounts={pagerdutyAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setPagerdutyAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setPagerdutyAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Opsgenie ──────────────────────────────────────────────────────── */}
        {shouldShowTile(opsgenieConnected) && <OpsgenieCard
          accounts={opsgenieAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setOpsgenieAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setOpsgenieAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── ServiceNow Incident ───────────────────────────────────────────── */}
        {shouldShowTile(servicenowConnected) && <ServiceNowIncidentCard
          accounts={servicenowAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setServicenowAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setServicenowAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Datadog Incidents ─────────────────────────────────────────────── */}
        {shouldShowTile(datadogConnected) && <DatadogIncidentsCard
          accounts={datadogAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setDatadogAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setDatadogAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── GCP ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(gcpConnected) && <GcpCard
          accounts={gcpAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setGcpAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setGcpAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Azure ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(azureConnected) && <AzureCard
          accounts={azureAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAzureAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setAzureAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Wiz ───────────────────────────────────────────────────────────── */}
        {shouldShowTile(wizConnected) && <WizCard
          accounts={wizAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setWizAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setWizAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Lacework ──────────────────────────────────────────────────────── */}
        {shouldShowTile(laceworkConnected) && <LaceworkCard
          accounts={laceworkAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setLaceworkAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setLaceworkAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Snyk ──────────────────────────────────────────────────────────── */}
        {shouldShowTile(snykConnected) && <SnykCard
          accounts={snykAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSnykAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSnykAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── SonarQube ─────────────────────────────────────────────────────── */}
        {shouldShowTile(sonarqubeConnected) && <SonarQubeCard
          accounts={sonarqubeAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSonarqubeAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSonarqubeAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Veracode ──────────────────────────────────────────────────────── */}
        {shouldShowTile(veracodeConnected) && <VeracodeCard
          accounts={veracodeAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setVeracodeAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setVeracodeAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Checkmarx ─────────────────────────────────────────────────────── */}
        {shouldShowTile(checkmarxConnected) && <CheckmarxCard
          accounts={checkmarxAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCheckmarxAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setCheckmarxAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── HashiCorp Vault ──────────────────────────────────────────────── */}
        {shouldShowTile(vaultConnected) && <VaultCard
          accounts={vaultAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setVaultAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setVaultAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── AWS Secrets Manager ──────────────────────────────────────────── */}
        {shouldShowTile(secretsManagerConnected) && <SecretsManagerCard
          accounts={secretsManagerAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setSecretsManagerAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setSecretsManagerAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Certificate Manager ──────────────────────────────────────────── */}
        {shouldShowTile(certManagerConnected) && <CertManagerCard
          accounts={certManagerAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setCertManagerAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setCertManagerAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Okta ─────────────────────────────────────────────────────────── */}
        {shouldShowTile(oktaConnected) && <OktaCard
          accounts={oktaAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setOktaAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setOktaAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── Azure AD ─────────────────────────────────────────────────────── */}
        {shouldShowTile(azureAdConnected) && <AzureAdCard
          accounts={azureAdAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setAzureAdAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setAzureAdAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {/* ── JumpCloud ────────────────────────────────────────────────────── */}
        {shouldShowTile(jumpCloudConnected) && <JumpCloudCard
          accounts={jumpCloudAccounts}
          loadingStatus={loading}
          onAccountAdded={(account) => setJumpCloudAccounts(prev => [...prev.filter(a => a.id !== account.id), account])}
          onAccountRemoved={(id) => setJumpCloudAccounts(prev => prev.filter(a => a.id !== id))}
          onToast={showToast}
        />}

        {ENGINEER_A_CARDS.slice(0, visibleEngineerACount).map((card) => (
          <EngineerAIntegrationCard
            key={card.key}
            config={card}
            loading={loading}
            onToast={showToast}
            activeTab={activeTab}
            getWorkflowConfig={workflowRuntimeConfigForEngineerACard}
            onConnectionCountChange={(count) =>
              setEngineerAConnectionCounts((prev) => ({ ...prev, [card.key]: count }))
            }
          />
        ))}

        {/* ── Static coming-soon cards ─────────────────────────────────────── */}
        {activeTab === 'available' && STATIC_INTEGRATIONS.map((integration) => (
          <Card key={integration.name} className="p-6 opacity-60 select-none">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 p-1 overflow-hidden">
                  <StaticIcon name={integration.name} className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                  <p className="text-sm text-gray-500">{integration.category}</p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </Card>
        ))}
      </div>

      {/* ── Show more (pagination for engineer-a cards) ──────────────────────── */}
      {visibleEngineerACount < ENGINEER_A_CARDS.length && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisibleEngineerACount((prev) => prev + PAGE_SIZE)}
            className="gap-1.5 text-sm"
          >
            Show more integrations ({ENGINEER_A_CARDS.length - visibleEngineerACount} remaining)
          </Button>
        </div>
      )}
      </Tabs>

      {showRequestToolModal && (
        <RequestToolModal
          onClose={() => setShowRequestToolModal(false)}
          onSubmitted={() => {
            setShowRequestToolModal(false);
            showToast('success', 'Tool request submitted! The team will review it shortly.');
          }}
        />
      )}
    </PageTemplate>
  );
}
