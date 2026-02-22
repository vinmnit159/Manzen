import { apiClient } from './client';

// ─── Shared params ────────────────────────────────────────────────────────────

export interface ReportParams {
  startDate: string; // ISO date string
  endDate:   string;
  granularity?: 'week' | 'month';
}

// ─── Framework Progress ───────────────────────────────────────────────────────

export interface FrameworkProgressSummary {
  total: number;
  implemented: number;
  partial: number;
  notImpl: number;
  pct: number;
}

export interface FrameworkProgressPoint {
  label: string;
  implemented: number;
  total: number;
  pct: number;
}

export interface FrameworkProgressData {
  summary: FrameworkProgressSummary;
  series: FrameworkProgressPoint[];
}

// ─── Risk Trend ───────────────────────────────────────────────────────────────

export interface RiskTrendSummary {
  total: number;
  open: number;
  mitigated: number;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
}

export interface RiskTrendPoint {
  label: string;
  CRITICAL: number;
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  total: number;
}

export interface RiskTrendData {
  summary: RiskTrendSummary;
  series: RiskTrendPoint[];
}

// ─── Test Completion ──────────────────────────────────────────────────────────

export interface TestCompletionSummary {
  total: number;
  completed: number;
  overdue: number;
  passRate: number;
}

export interface TestCompletionPoint {
  label: string;
  onTime: number;
  late: number;
  noDue: number;
  total: number;
}

export interface TestCompletionData {
  summary: TestCompletionSummary;
  series: TestCompletionPoint[];
}

// ─── Audit Summary ────────────────────────────────────────────────────────────

export interface AuditSummaryStats {
  totalAudits: number;
  completed: number;
  inProgress: number;
  openFindings: number;
  closedFindings: number;
}

export interface AuditRow {
  id: string;
  type: string;
  auditor: string;
  scope: string;
  startDate: string;
  endDate: string | null;
  status: string;
  major: number;
  minor: number;
  observation: number;
}

export interface AuditSummaryData {
  summary: AuditSummaryStats;
  audits: AuditRow[];
}

// ─── Evidence Coverage ────────────────────────────────────────────────────────

export interface EvidenceCoverageSummary {
  total: number;
  withEvidence: number;
  withoutEvidence: number;
  coveragePct: number;
}

export interface EvidenceControlRow {
  id: string;
  isoReference: string;
  title: string;
  status: string;
  evidenceCount: number;
}

export interface EvidenceCoverageData {
  summary: EvidenceCoverageSummary;
  controls: EvidenceControlRow[];
}

// ─── Personnel Compliance ─────────────────────────────────────────────────────

export interface PersonnelSummary {
  total: number;
  allComplete: number;
  partial: number;
  notStarted: number;
}

export interface PersonnelRow {
  id: string;
  name: string;
  email: string;
  role: string;
  policyAccepted: boolean;
  mdmEnrolled: boolean;
  trainingCompleted: boolean;
  completedCount: number;
  allComplete: boolean;
}

export interface PersonnelComplianceData {
  summary: PersonnelSummary;
  users: PersonnelRow[];
}

// ─── Service ─────────────────────────────────────────────────────────────────

function toQs(params: ReportParams): Record<string, string> {
  const q: Record<string, string> = {
    startDate: params.startDate,
    endDate:   params.endDate,
  };
  if (params.granularity) q.granularity = params.granularity;
  return q;
}

export const reportsService = {
  async getFrameworkProgress(params: ReportParams): Promise<{ success: boolean; data: FrameworkProgressData }> {
    return apiClient.get('/api/reports/framework-progress', toQs(params));
  },

  async getRiskTrend(params: ReportParams): Promise<{ success: boolean; data: RiskTrendData }> {
    return apiClient.get('/api/reports/risk-trend', toQs(params));
  },

  async getTestCompletion(params: ReportParams): Promise<{ success: boolean; data: TestCompletionData }> {
    return apiClient.get('/api/reports/test-completion', toQs(params));
  },

  async getAuditSummary(params: ReportParams): Promise<{ success: boolean; data: AuditSummaryData }> {
    return apiClient.get('/api/reports/audit-summary', toQs(params));
  },

  async getEvidenceCoverage(): Promise<{ success: boolean; data: EvidenceCoverageData }> {
    return apiClient.get('/api/reports/evidence-coverage');
  },

  async getPersonnelCompliance(): Promise<{ success: boolean; data: PersonnelComplianceData }> {
    return apiClient.get('/api/reports/personnel-compliance');
  },
};
