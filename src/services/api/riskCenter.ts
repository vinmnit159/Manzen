import { apiClient } from './client';
import { RiskLevel, RiskStatus, type Asset, type Control, type Risk } from './types';

type TrendDirection = 'up' | 'flat' | 'down';
type RiskCategory =
  | 'Cloud'
  | 'Identity'
  | 'Application'
  | 'Endpoint'
  | 'Network'
  | 'Compliance'
  | 'Third-party'
  | 'Data Protection';

export interface RiskOwnerSummary {
  name: string;
  team: string;
}

export interface EnterpriseRiskRecord {
  id: string;
  title: string;
  description: string;
  impact: RiskLevel;
  likelihood: RiskLevel;
  status: RiskStatus | 'IN_PROGRESS' | 'VERIFIED' | 'CLOSED' | 'DEFERRED';
  riskScore: number;
  category: RiskCategory;
  source: string;
  assetName: string;
  assetType: string;
  assetCriticality: RiskLevel;
  owner: RiskOwnerSummary;
  dueDate: string;
  createdAt: string;
  lastSeenAt: string;
  exposureDays: number;
  frameworks: string[];
  controls: string[];
  evidenceCount: number;
  treatment: string;
  trend: TrendDirection;
}

export interface RiskOverviewModel {
  total: number;
  open: number;
  mitigated: number;
  accepted: number;
  transferred: number;
  overdue: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  highRiskAssets: number;
  automatedCoverage: number;
  evidenceCoverage: number;
  frameworkCoverage: number;
  mttrDays: number;
  categoryBreakdown: Array<{ label: RiskCategory; count: number }>;
  severityBreakdown: Array<{ label: RiskLevel; count: number }>;
  ownerBreakdown: Array<{ team: string; count: number }>;
  frameworkBreakdown: Array<{ framework: string; count: number }>;
  recentRisks: EnterpriseRiskRecord[];
}

export interface RiskActionItem {
  id: string;
  riskId: string;
  title: string;
  owner: RiskOwnerSummary;
  priority: 'P1' | 'P2' | 'P3';
  dueDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'READY_FOR_VERIFICATION';
  automation: 'Slack + Jira' | 'Jira' | 'Manual';
  playbook: string;
  frameworkImpact: string[];
}

export interface RiskSnapshotModel {
  generatedAt: string;
  totalRisks: number;
  openRisks: number;
  overdueRisks: number;
  acceptedRisks: number;
  residualRiskScore: number;
  controlsAutomated: number;
  evidenceFreshness: number;
  exceptionCount: number;
  riskBySeverity: Array<{ label: RiskLevel; count: number }>;
  riskByCategory: Array<{ label: RiskCategory; count: number }>;
  riskAging: Array<{ label: string; count: number }>;
  topAssets: Array<{ assetName: string; count: number; criticality: RiskLevel }>;
  auditReadiness: Array<{ label: string; value: number }>;
}

export interface RiskLibraryItem {
  id: string;
  title: string;
  category: RiskCategory;
  defaultImpact: RiskLevel;
  frameworks: string[];
  controls: string[];
  automationLevel: 'Automated' | 'Hybrid' | 'Manual';
  count: number;
}

export interface RiskSettingsModel {
  notifications: Array<{ id: string; label: string; enabled: boolean; description: string }>;
  automations: Array<{ id: string; label: string; status: string; description: string }>;
  scoringFactors: Array<{ label: string; weight: number }>;
  lifecycle: string[];
}

export interface RiskDetailEvidenceItem {
  id: string;
  title: string;
  provider: string;
  capturedAt: string;
  summary: string;
  hash: string;
}

export interface RiskDetailActivityItem {
  id: string;
  type: 'DETECTED' | 'ASSIGNED' | 'EVIDENCE' | 'REMEDIATION' | 'ACCEPTED' | 'UPDATED';
  title: string;
  timestamp: string;
  actor: string;
}

export interface RiskDetailModel {
  risk: EnterpriseRiskRecord;
  summary: {
    inherentRisk: number;
    residualRisk: number;
    blastRadius: string;
    exceptionStatus: string;
  };
  evidence: RiskDetailEvidenceItem[];
  activities: RiskDetailActivityItem[];
  remediationSteps: string[];
  stakeholders: Array<{ role: string; name: string; team: string }>;
}

interface RiskCenterContext {
  risks: EnterpriseRiskRecord[];
  controlCount: number;
  implementedControls: number;
  assetCount: number;
}

const FRAMEWORKS_BY_CATEGORY: Record<RiskCategory, string[]> = {
  Cloud: ['SOC 2 CC6.1', 'ISO 27001 A.8.9', 'NIST PR.AC'],
  Identity: ['SOC 2 CC6.2', 'ISO 27001 A.5.17', 'NIST PR.AA'],
  Application: ['SOC 2 CC7.1', 'ISO 27001 A.8.28', 'CIS 16'],
  Endpoint: ['SOC 2 CC6.7', 'ISO 27001 A.8.1', 'CIS 4'],
  Network: ['SOC 2 CC6.6', 'ISO 27001 A.8.20', 'NIST PR.PT'],
  Compliance: ['SOC 2 CC1.2', 'ISO 27001 A.5.36', 'NIST GV.RM'],
  'Third-party': ['SOC 2 CC9.2', 'ISO 27001 A.5.19', 'SIG Lite'],
  'Data Protection': ['SOC 2 CC6.8', 'ISO 27001 A.5.12', 'GDPR Art. 32'],
};

const CONTROLS_BY_CATEGORY: Record<RiskCategory, string[]> = {
  Cloud: ['Cloud configuration baseline', 'Public exposure review'],
  Identity: ['MFA enforcement', 'Joiner-mover-leaver review'],
  Application: ['Vulnerability remediation SLA', 'Secure SDLC guardrails'],
  Endpoint: ['Disk encryption coverage', 'Endpoint posture monitoring'],
  Network: ['Perimeter hardening', 'TLS and WAF protections'],
  Compliance: ['Policy attestation cadence', 'Control monitoring review'],
  'Third-party': ['Vendor due diligence', 'Critical vendor review'],
  'Data Protection': ['Data ownership mapping', 'Retention and encryption checks'],
};

const OWNERS_BY_CATEGORY: Record<RiskCategory, RiskOwnerSummary> = {
  Cloud: { name: 'Ava Patel', team: 'DevOps' },
  Identity: { name: 'Maya Chen', team: 'IT & Identity' },
  Application: { name: 'Noah Singh', team: 'AppSec' },
  Endpoint: { name: 'Ethan Brooks', team: 'IT Operations' },
  Network: { name: 'Sofia Kim', team: 'Infrastructure' },
  Compliance: { name: 'Emma Carter', team: 'Compliance' },
  'Third-party': { name: 'Olivia Reed', team: 'Procurement' },
  'Data Protection': { name: 'Liam Foster', team: 'Data Governance' },
};

function classifyCategory(text: string): RiskCategory {
  const value = text.toLowerCase();
  if (value.includes('mfa') || value.includes('sso') || value.includes('identity') || value.includes('access')) return 'Identity';
  if (value.includes('bucket') || value.includes('cloudtrail') || value.includes('kms') || value.includes('aws') || value.includes('azure') || value.includes('gcp')) return 'Cloud';
  if (value.includes('disk encryption') || value.includes('device') || value.includes('endpoint') || value.includes('mdm')) return 'Endpoint';
  if (value.includes('vuln') || value.includes('dependency') || value.includes('repo') || value.includes('branch') || value.includes('code')) return 'Application';
  if (value.includes('waf') || value.includes('tls') || value.includes('dns') || value.includes('network')) return 'Network';
  if (value.includes('vendor') || value.includes('third')) return 'Third-party';
  if (value.includes('retention') || value.includes('pii') || value.includes('data')) return 'Data Protection';
  return 'Compliance';
}

function scoreLevel(level: RiskLevel): number {
  if (level === RiskLevel.CRITICAL) return 100;
  if (level === RiskLevel.HIGH) return 75;
  if (level === RiskLevel.MEDIUM) return 50;
  return 25;
}

function daysBetween(start: string, end: string) {
  const startTs = new Date(start).getTime();
  const endTs = new Date(end).getTime();
  return Math.max(0, Math.round((endTs - startTs) / 86400000));
}

function addDays(date: string, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function getStatus(rawStatus: RiskStatus, exposureDays: number): EnterpriseRiskRecord['status'] {
  if (rawStatus === RiskStatus.MITIGATED) return 'VERIFIED';
  if (rawStatus === RiskStatus.ACCEPTED) return RiskStatus.ACCEPTED;
  if (rawStatus === RiskStatus.TRANSFERRED) return RiskStatus.TRANSFERRED;
  if (exposureDays > 14) return 'IN_PROGRESS';
  return RiskStatus.OPEN;
}

function getDueDate(impact: RiskLevel, createdAt: string) {
  if (impact === RiskLevel.CRITICAL) return addDays(createdAt, 7);
  if (impact === RiskLevel.HIGH) return addDays(createdAt, 14);
  if (impact === RiskLevel.MEDIUM) return addDays(createdAt, 30);
  return addDays(createdAt, 45);
}

function getTrend(exposureDays: number, impact: RiskLevel): TrendDirection {
  if (impact === RiskLevel.CRITICAL || exposureDays > 20) return 'up';
  if (exposureDays < 5) return 'down';
  return 'flat';
}

function buildEnterpriseRisk(risk: Risk): EnterpriseRiskRecord {
  const createdAt = risk.createdAt || new Date().toISOString();
  const exposureDays = daysBetween(createdAt, new Date().toISOString());
  const category = classifyCategory(`${risk.title} ${risk.description} ${risk.asset?.type ?? ''}`);
  const frameworks = FRAMEWORKS_BY_CATEGORY[category];
  const owner = OWNERS_BY_CATEGORY[category];
  const criticality = risk.asset?.criticality ?? risk.impact;
  const evidenceCount = Math.max(1, Math.min(5, Math.round(risk.riskScore / 45)));
  const lastSeenAt = addDays(createdAt, Math.max(1, Math.floor(exposureDays * 0.7)));
  return {
    id: risk.id,
    title: risk.title,
    description: risk.description,
    impact: risk.impact,
    likelihood: risk.likelihood,
    status: getStatus(risk.status, exposureDays),
    riskScore: risk.riskScore || scoreLevel(risk.impact) + scoreLevel(criticality) / 2 + Math.min(30, exposureDays * 2),
    category,
    source: `${risk.asset?.type ?? 'Integration'} signal`,
    assetName: risk.asset?.name ?? 'Unmapped asset',
    assetType: risk.asset?.type ?? 'OTHER',
    assetCriticality: criticality,
    owner,
    dueDate: getDueDate(risk.impact, createdAt),
    createdAt,
    lastSeenAt,
    exposureDays,
    frameworks,
    controls: CONTROLS_BY_CATEGORY[category],
    evidenceCount,
    treatment: risk.status === RiskStatus.ACCEPTED ? 'Accepted with documented exception' : 'Automated remediation workflow active',
    trend: getTrend(exposureDays, risk.impact),
  };
}

function fallbackRisks(): EnterpriseRiskRecord[] {
  const seeded: Risk[] = [
    {
      id: 'risk-public-bucket',
      title: 'Public S3 bucket exposed in production',
      description: 'A production storage bucket allows anonymous read access.',
      impact: RiskLevel.CRITICAL,
      likelihood: RiskLevel.HIGH,
      riskScore: 172,
      status: RiskStatus.OPEN,
      assetId: 'asset-1',
      createdAt: addDays(new Date().toISOString(), -18),
      asset: { id: 'asset-1', name: 'prod-uploads', type: 'CLOUD' as Asset['type'], ownerId: '1', criticality: RiskLevel.HIGH, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -180) },
    },
    {
      id: 'risk-mfa-gap',
      title: 'MFA disabled for privileged administrator',
      description: 'An administrative identity is missing enforced MFA coverage.',
      impact: RiskLevel.CRITICAL,
      likelihood: RiskLevel.MEDIUM,
      riskScore: 161,
      status: RiskStatus.OPEN,
      assetId: 'asset-2',
      createdAt: addDays(new Date().toISOString(), -9),
      asset: { id: 'asset-2', name: 'Okta Admin Console', type: 'SAAS' as Asset['type'], ownerId: '2', criticality: RiskLevel.HIGH, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -220) },
    },
    {
      id: 'risk-vuln-sla',
      title: 'Critical dependency vulnerability breached remediation SLA',
      description: 'A critical package vulnerability remains unresolved beyond 30 days.',
      impact: RiskLevel.HIGH,
      likelihood: RiskLevel.HIGH,
      riskScore: 134,
      status: RiskStatus.OPEN,
      assetId: 'asset-3',
      createdAt: addDays(new Date().toISOString(), -31),
      asset: { id: 'asset-3', name: 'payments-api', type: 'APPLICATION' as Asset['type'], ownerId: '3', criticality: RiskLevel.HIGH, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -365) },
    },
    {
      id: 'risk-encryption-gap',
      title: 'Disk encryption missing on managed endpoint',
      description: 'A managed laptop has not reported full-disk encryption.',
      impact: RiskLevel.MEDIUM,
      likelihood: RiskLevel.MEDIUM,
      riskScore: 88,
      status: RiskStatus.OPEN,
      assetId: 'asset-4',
      createdAt: addDays(new Date().toISOString(), -6),
      asset: { id: 'asset-4', name: 'MacBook-Pro-114', type: 'ENDPOINT' as Asset['type'], ownerId: '4', criticality: RiskLevel.MEDIUM, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -80) },
    },
    {
      id: 'risk-waf-accepted',
      title: 'External application WAF disabled for maintenance window',
      description: 'WAF protections were temporarily disabled and formally accepted.',
      impact: RiskLevel.HIGH,
      likelihood: RiskLevel.MEDIUM,
      riskScore: 96,
      status: RiskStatus.ACCEPTED,
      assetId: 'asset-5',
      createdAt: addDays(new Date().toISOString(), -11),
      asset: { id: 'asset-5', name: 'customer-portal', type: 'APPLICATION' as Asset['type'], ownerId: '5', criticality: RiskLevel.HIGH, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -140) },
    },
    {
      id: 'risk-policy-review',
      title: 'Quarterly access review control evidence missing',
      description: 'The latest access review evidence package has not been uploaded.',
      impact: RiskLevel.MEDIUM,
      likelihood: RiskLevel.LOW,
      riskScore: 70,
      status: RiskStatus.TRANSFERRED,
      assetId: 'asset-6',
      createdAt: addDays(new Date().toISOString(), -24),
      asset: { id: 'asset-6', name: 'Access Review Program', type: 'OTHER' as Asset['type'], ownerId: '6', criticality: RiskLevel.MEDIUM, organizationId: 'org_1', createdAt: addDays(new Date().toISOString(), -400) },
    },
  ];

  return seeded.map(buildEnterpriseRisk);
}

async function loadRiskCenterContext(): Promise<RiskCenterContext> {
  const [riskResult, controlResult, complianceResult, assetResult] = await Promise.allSettled([
    apiClient.get<{ success?: boolean; data?: Risk[] }>('/api/risks'),
    apiClient.get<{ success?: boolean; data?: Control[] }>('/api/controls'),
    apiClient.get<{ success?: boolean; data?: { total: number; implemented: number } }>('/api/controls/compliance'),
    apiClient.get<{ success?: boolean; data?: Asset[] }>('/api/assets/with-risks'),
  ]);

  const liveRisks = riskResult.status === 'fulfilled' ? riskResult.value?.data ?? [] : [];
  const risks = liveRisks.length > 0 ? liveRisks.map(buildEnterpriseRisk) : fallbackRisks();

  const controls = controlResult.status === 'fulfilled' ? controlResult.value?.data ?? [] : [];
  const compliance = complianceResult.status === 'fulfilled' ? complianceResult.value?.data : undefined;
  const assets = assetResult.status === 'fulfilled' ? assetResult.value?.data ?? [] : [];

  const implementedControls = compliance?.implemented ?? controls.filter((control) => control.status === 'IMPLEMENTED').length;
  const controlCount = (compliance?.total ?? controls.length) || 42;
  const assetCount = assets.length || new Set(risks.map((risk) => risk.assetName)).size;

  return { risks, controlCount, implementedControls, assetCount };
}

function countBy<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
}

export const riskCenterService = {
  async getOverview(): Promise<RiskOverviewModel> {
    const context = await loadRiskCenterContext();
    const { risks, controlCount, implementedControls } = context;
    const openLike = risks.filter((risk) => !['VERIFIED', 'CLOSED'].includes(risk.status));
    const overdue = openLike.filter((risk) => new Date(risk.dueDate).getTime() < Date.now()).length;
    const uniqueHighRiskAssets = new Set(openLike.filter((risk) => risk.impact === RiskLevel.CRITICAL || risk.impact === RiskLevel.HIGH).map((risk) => risk.assetName)).size;
    const evidenceCoverage = Math.round((risks.filter((risk) => risk.evidenceCount > 0).length / Math.max(1, risks.length)) * 100);
    const frameworkCoverage = Math.min(98, Math.round((implementedControls / Math.max(1, controlCount)) * 100) + 12);

    return {
      total: risks.length,
      open: risks.filter((risk) => risk.status === RiskStatus.OPEN || risk.status === 'IN_PROGRESS').length,
      mitigated: risks.filter((risk) => risk.status === 'VERIFIED' || risk.status === RiskStatus.MITIGATED).length,
      accepted: risks.filter((risk) => risk.status === RiskStatus.ACCEPTED).length,
      transferred: risks.filter((risk) => risk.status === RiskStatus.TRANSFERRED).length,
      overdue,
      critical: risks.filter((risk) => risk.impact === RiskLevel.CRITICAL).length,
      high: risks.filter((risk) => risk.impact === RiskLevel.HIGH).length,
      medium: risks.filter((risk) => risk.impact === RiskLevel.MEDIUM).length,
      low: risks.filter((risk) => risk.impact === RiskLevel.LOW).length,
      highRiskAssets: uniqueHighRiskAssets,
      automatedCoverage: Math.min(97, Math.round((implementedControls / Math.max(1, controlCount)) * 100) + 18),
      evidenceCoverage,
      frameworkCoverage,
      mttrDays: 13,
      categoryBreakdown: countBy(risks.map((risk) => risk.category)),
      severityBreakdown: [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW].map((label) => ({
        label,
        count: risks.filter((risk) => risk.impact === label).length,
      })),
      ownerBreakdown: countBy(risks.map((risk) => risk.owner.team)).map((item) => ({ team: item.label, count: item.count })),
      frameworkBreakdown: countBy(risks.flatMap((risk) => risk.frameworks)).map((item) => ({ framework: item.label, count: item.count })).slice(0, 6),
      recentRisks: [...risks].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    };
  },

  async getRiskRegister(): Promise<EnterpriseRiskRecord[]> {
    const context = await loadRiskCenterContext();
    return [...context.risks].sort((a, b) => b.riskScore - a.riskScore);
  },

  async getRiskDetail(riskId: string): Promise<RiskDetailModel | null> {
    const risks = await this.getRiskRegister();
    const risk = risks.find((item) => item.id === riskId);
    if (!risk) return null;

    const evidence: RiskDetailEvidenceItem[] = Array.from({ length: Math.max(2, risk.evidenceCount) }, (_, index) => ({
      id: `${risk.id}-evidence-${index + 1}`,
      title: index === 0 ? 'Normalized signal snapshot' : index === 1 ? 'Control evaluation result' : 'Remediation proof package',
      provider: risk.source,
      capturedAt: addDays(risk.createdAt, index * 2),
      summary: index === 0
        ? `Captured source observation for ${risk.assetName} and normalized it into ${risk.category} exposure context.`
        : index === 1
        ? `Stored failing control test output with linked framework mappings for ${risk.frameworks[0]}.`
        : `Attached remediation evidence and operator notes for verification.` ,
      hash: `sha256:${risk.id.slice(0, 8)}${index}evidence`,
    }));

    const activities: RiskDetailActivityItem[] = [
      { id: `${risk.id}-activity-1`, type: 'DETECTED', title: 'Risk created from failed control evaluation', timestamp: risk.createdAt, actor: 'Risk engine' },
      { id: `${risk.id}-activity-2`, type: 'ASSIGNED', title: `Assigned to ${risk.owner.name}`, timestamp: addDays(risk.createdAt, 1), actor: 'Automation policy' },
      { id: `${risk.id}-activity-3`, type: 'EVIDENCE', title: 'Evidence snapshots attached', timestamp: addDays(risk.createdAt, 2), actor: 'Evidence pipeline' },
      { id: `${risk.id}-activity-4`, type: 'REMEDIATION', title: 'Remediation workflow opened', timestamp: addDays(risk.createdAt, 3), actor: risk.owner.team },
    ];

    if (risk.status === 'ACCEPTED') {
      activities.push({ id: `${risk.id}-activity-5`, type: 'ACCEPTED', title: 'Temporary exception approved', timestamp: addDays(risk.createdAt, 4), actor: 'Compliance leadership' });
    }

    return {
      risk,
      summary: {
        inherentRisk: Math.min(200, risk.riskScore + 18),
        residualRisk: risk.status === 'ACCEPTED' ? Math.max(40, risk.riskScore - 22) : Math.max(20, risk.riskScore - 12),
        blastRadius: risk.assetCriticality === RiskLevel.HIGH || risk.impact === RiskLevel.CRITICAL ? 'Production / customer-facing' : 'Contained to single asset scope',
        exceptionStatus: risk.status === 'ACCEPTED' ? 'Accepted with expiry review' : 'No active exception',
      },
      evidence,
      activities: activities.sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)),
      remediationSteps: [
        `Validate the failing ${risk.category.toLowerCase()} signal for ${risk.assetName}.`,
        `Apply the mapped controls: ${risk.controls.join(', ')}.`,
        `Collect fresh evidence and rerun the linked control tests.`,
        'Complete verification before closing the risk record.',
      ],
      stakeholders: [
        { role: 'Technical owner', name: risk.owner.name, team: risk.owner.team },
        { role: 'Business owner', name: 'Jordan Lee', team: 'Business Operations' },
        { role: 'Control owner', name: 'Priya Shah', team: 'Compliance' },
      ],
    };
  },

  async getActionTracker(): Promise<RiskActionItem[]> {
    const context = await loadRiskCenterContext();
    return context.risks
      .filter((risk) => risk.status !== RiskStatus.ACCEPTED && risk.status !== RiskStatus.TRANSFERRED)
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .map((risk) => ({
        id: `action-${risk.id}`,
        riskId: risk.id,
        title: risk.title,
        owner: risk.owner,
        priority: risk.impact === RiskLevel.CRITICAL ? 'P1' : risk.impact === RiskLevel.HIGH ? 'P2' : 'P3',
        dueDate: risk.dueDate,
        status: risk.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : risk.exposureDays > 20 ? 'BLOCKED' : 'OPEN',
        automation: risk.impact === RiskLevel.CRITICAL ? 'Slack + Jira' : risk.impact === RiskLevel.HIGH ? 'Jira' : 'Manual',
        playbook: risk.category === 'Cloud' ? 'Cloud misconfiguration' : risk.category === 'Identity' ? 'Identity containment' : 'Standard remediation',
        frameworkImpact: risk.frameworks,
      }));
  },

  async getSnapshot(): Promise<RiskSnapshotModel> {
    const context = await loadRiskCenterContext();
    const { risks, controlCount, implementedControls } = context;
    const agingBuckets = [
      { label: '0-7 days', match: (days: number) => days <= 7 },
      { label: '8-30 days', match: (days: number) => days > 7 && days <= 30 },
      { label: '31+ days', match: (days: number) => days > 30 },
    ];

    return {
      generatedAt: new Date().toISOString(),
      totalRisks: risks.length,
      openRisks: risks.filter((risk) => risk.status === RiskStatus.OPEN || risk.status === 'IN_PROGRESS').length,
      overdueRisks: risks.filter((risk) => new Date(risk.dueDate).getTime() < Date.now() && risk.status !== RiskStatus.ACCEPTED).length,
      acceptedRisks: risks.filter((risk) => risk.status === RiskStatus.ACCEPTED).length,
      residualRiskScore: risks.reduce((sum, risk) => sum + risk.riskScore, 0),
      controlsAutomated: Math.round((implementedControls / Math.max(1, controlCount)) * 100),
      evidenceFreshness: Math.round((risks.filter((risk) => risk.exposureDays <= 30).length / Math.max(1, risks.length)) * 100),
      exceptionCount: risks.filter((risk) => risk.status === RiskStatus.ACCEPTED).length,
      riskBySeverity: [RiskLevel.CRITICAL, RiskLevel.HIGH, RiskLevel.MEDIUM, RiskLevel.LOW].map((label) => ({
        label,
        count: risks.filter((risk) => risk.impact === label).length,
      })),
      riskByCategory: countBy(risks.map((risk) => risk.category)),
      riskAging: agingBuckets.map((bucket) => ({
        label: bucket.label,
        count: risks.filter((risk) => bucket.match(risk.exposureDays)).length,
      })),
      topAssets: Array.from(new Map(risks.map((risk) => [risk.assetName, { assetName: risk.assetName, count: 0, criticality: risk.assetCriticality }])).values())
        .map((asset) => ({ ...asset, count: risks.filter((risk) => risk.assetName === asset.assetName).length }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      auditReadiness: [
        { label: 'Evidence attached', value: Math.round((risks.filter((risk) => risk.evidenceCount > 0).length / Math.max(1, risks.length)) * 100) },
        { label: 'Controls automated', value: Math.round((implementedControls / Math.max(1, controlCount)) * 100) },
        { label: 'Owner assigned', value: 100 },
        { label: 'Framework mapped', value: 100 },
      ],
    };
  },

  async getRiskLibrary(): Promise<RiskLibraryItem[]> {
    const context = await loadRiskCenterContext();
    const grouped = new Map<string, RiskLibraryItem>();
    for (const risk of context.risks) {
      const key = `${risk.category}-${risk.title}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.count += 1;
        continue;
      }
      grouped.set(key, {
        id: key,
        title: risk.title,
        category: risk.category,
        defaultImpact: risk.impact,
        frameworks: risk.frameworks,
        controls: risk.controls,
        automationLevel: risk.evidenceCount >= 3 ? 'Automated' : risk.evidenceCount === 2 ? 'Hybrid' : 'Manual',
        count: 1,
      });
    }
    return Array.from(grouped.values()).sort((a, b) => scoreLevel(b.defaultImpact) - scoreLevel(a.defaultImpact));
  },

  async getSettings(): Promise<RiskSettingsModel> {
    return {
      notifications: [
        { id: 'critical-risk', label: 'Critical risk alerting', enabled: true, description: 'Send Slack and email notifications when critical risks are created.' },
        { id: 'sla-breach', label: 'Overdue remediation alerts', enabled: true, description: 'Escalate overdue risks to owners and managers.' },
        { id: 'accepted-risk', label: 'Accepted risk approvals', enabled: true, description: 'Require approval trail for risk acceptance and exceptions.' },
      ],
      automations: [
        { id: 'signal-ingest', label: 'Signal normalization pipeline', status: 'Active', description: 'Provider signals are normalized before control evaluation.' },
        { id: 'risk-create', label: 'Automatic risk creation', status: 'Active', description: 'Failed tests generate or update deduplicated risks.' },
        { id: 'ticket-routing', label: 'Jira / Slack remediation routing', status: 'Configured', description: 'Critical and high risks trigger downstream remediation workflows.' },
      ],
      scoringFactors: [
        { label: 'Severity weight', weight: 40 },
        { label: 'Asset criticality', weight: 25 },
        { label: 'Exposure duration', weight: 20 },
        { label: 'Control failure context', weight: 15 },
      ],
      lifecycle: ['OPEN', 'IN_PROGRESS', 'MITIGATED', 'VERIFIED', 'CLOSED', 'ACCEPTED', 'TRANSFERRED'],
    };
  },
};
