import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditType    = 'INTERNAL' | 'EXTERNAL' | 'SURVEILLANCE' | 'RECERTIFICATION';
export type AuditStatus  = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
export type AuditControlStatus = 'PENDING' | 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE';
export type FindingSeverity = 'MINOR' | 'MAJOR' | 'OBSERVATION' | 'OFI';

export interface AuditSnapshot {
  id:                    string;
  auditId:               string;
  capturedAt:            string;
  totalControls:         number;
  compliantControls:     number;
  nonCompliantControls:  number;
  notApplicableControls: number;
  pendingControls:       number;
  compliancePct:         number;
  totalFindings:         number;
  openFindings:          number;
  closedFindings:        number;
  majorFindings:         number;
  minorFindings:         number;
  observationFindings:   number;
  ofiFindings:           number;
  criticalRisks:         number;
  highRisks:             number;
  mediumRisks:           number;
  lowRisks:              number;
}

export interface AuditFindingRecord {
  id:          string;
  auditId:     string;
  controlId:   string;
  severity:    FindingSeverity;
  description: string;
  remediation: string | null;
  status:      string;
  createdAt:   string;
  control?: { id: string; isoReference: string; title: string };
}

export interface AuditControlRecord {
  id:           string;
  auditId:      string;
  controlId:    string;
  reviewStatus: AuditControlStatus;
  reviewedBy:   string | null;
  reviewedAt:   string | null;
  notes:        string | null;
  control: {
    id:           string;
    isoReference: string;
    title:        string;
    status:       string;
    description?: string;
    evidence?:    any[];
    riskMappings?: any[];
    testMappings?: any[];
    findings?:    any[];
  };
}

export interface AuditRecord {
  id:                   string;
  name:                 string;
  type:                 AuditType;
  frameworkName:        string | null;
  periodStart:          string | null;
  periodEnd:            string | null;
  startDate:            string;
  endDate:              string | null;
  status:               AuditStatus;
  assignedAuditorId:    string | null;
  externalAuditorEmail: string | null;
  ownerId:              string;
  organizationId:       string;
  createdAt:            string;
  closedAt:             string | null;
  // Final report fields
  executiveSummary:     string | null;
  auditConclusion:      string | null;
  signedPdfUrl:         string | null;
  signedAt:             string | null;
  signedById:           string | null;
  isLocked:             boolean;
  findings:             AuditFindingRecord[];
  auditControls?:       AuditControlRecord[];
  snapshot?:            AuditSnapshot | null;
  _count?:              { auditControls: number };
}

/** Live metrics returned by GET /:id/report (before snapshot exists) */
export interface AuditReportMetrics {
  totalControls:         number;
  compliantControls:     number;
  nonCompliantControls:  number;
  notApplicableControls: number;
  pendingControls:       number;
  compliancePct:         number;
  totalFindings:         number;
  openFindings:          number;
  closedFindings:        number;
  majorFindings:         number;
  minorFindings:         number;
  observationFindings:   number;
  ofiFindings:           number;
}

export interface AuditReportResponse {
  audit:   AuditRecord;
  metrics: AuditReportMetrics;
}

export interface CreateAuditPayload {
  name:                  string;
  type:                  AuditType;
  frameworkName?:        string;
  periodStart?:          string;
  periodEnd?:            string;
  startDate:             string;
  endDate?:              string;
  assignedAuditorId?:    string;
  externalAuditorEmail?: string;
  controlIds?:           string[];
  allControls?:          boolean;
}

export interface CreateFindingPayload {
  controlId:    string;
  severity:     FindingSeverity;
  description:  string;
  remediation?: string;
  status?:      string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const auditsService = {
  list(params?: { type?: AuditType; status?: AuditStatus; search?: string }) {
    return apiClient.get<{ success: boolean; data: AuditRecord[] }>('/api/audits', params as any);
  },

  get(id: string) {
    return apiClient.get<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}`);
  },

  create(payload: CreateAuditPayload) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>('/api/audits', payload);
  },

  update(id: string, payload: Partial<CreateAuditPayload>) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}`, payload);
  },

  start(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}/start`);
  },

  close(id: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${id}/close`);
  },

  listControls(id: string) {
    return apiClient.get<{ success: boolean; data: AuditControlRecord[] }>(`/api/audits/${id}/controls`);
  },

  updateControl(auditId: string, controlId: string, payload: { reviewStatus?: AuditControlStatus; notes?: string }) {
    return apiClient.patch<{ success: boolean; data: AuditControlRecord }>(`/api/audits/${auditId}/controls/${controlId}`, payload);
  },

  createFinding(auditId: string, payload: CreateFindingPayload) {
    return apiClient.post<{ success: boolean; data: AuditFindingRecord }>(`/api/audits/${auditId}/findings`, payload);
  },

  updateFinding(auditId: string, findingId: string, payload: Partial<Omit<CreateFindingPayload, 'controlId'>>) {
    return apiClient.patch<{ success: boolean; data: AuditFindingRecord }>(`/api/audits/${auditId}/findings/${findingId}`, payload);
  },

  deleteFinding(auditId: string, findingId: string) {
    return apiClient.delete<{ success: boolean }>(`/api/audits/${auditId}/findings/${findingId}`);
  },

  // ── Final Report ────────────────────────────────────────────────────────────

  /** Get final report draft + live metrics */
  getReport(auditId: string) {
    return apiClient.get<{ success: boolean; data: AuditReportResponse }>(`/api/audits/${auditId}/report`);
  },

  /** Update executive summary / conclusion / PDF URL */
  updateReport(auditId: string, payload: {
    executiveSummary?: string | null;
    auditConclusion?:  string | null;
    signedPdfUrl?:     string | null;
  }) {
    return apiClient.patch<{ success: boolean; data: AuditRecord }>(`/api/audits/${auditId}/report`, payload);
  },

  /** Sign & complete — locks audit, captures snapshot, → COMPLETED */
  signAndComplete(auditId: string) {
    return apiClient.post<{ success: boolean; data: AuditRecord }>(`/api/audits/${auditId}/sign-and-complete`);
  },
};
