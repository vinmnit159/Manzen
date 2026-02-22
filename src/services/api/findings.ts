import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FindingSeverity = 'MINOR' | 'MAJOR' | 'OBSERVATION' | 'OFI';
export type FindingStatus   = 'OPEN' | 'IN_REMEDIATION' | 'READY_FOR_REVIEW' | 'CLOSED';

export interface FindingRecord {
  id:              string;
  auditId:         string;
  controlId:       string;
  organizationId:  string;
  severity:        FindingSeverity;
  status:          FindingStatus;
  description:     string;
  remediationPlan: string | null;
  dueDate:         string | null;
  assignedTo:      string | null;
  evidenceUrl:     string | null;
  createdAt:       string;
  closedAt:        string | null;
  control?:  { id: string; isoReference: string; title: string };
  audit?:    { id: string; name: string; type: string };
  assignee?: { id: string; name: string | null; email: string } | null;
}

export interface CreateFindingRequest {
  auditId:         string;
  controlId:       string;
  severity:        FindingSeverity;
  description:     string;
  remediationPlan?: string;
  dueDate?:        string;
  assignedTo?:     string;
}

export interface UpdateFindingRequest {
  remediationPlan?: string | null;
  dueDate?:         string | null;
  assignedTo?:      string | null;
  severity?:        FindingSeverity;
  description?:     string;
}

export interface ListFindingsParams {
  severity?:  FindingSeverity;
  status?:    FindingStatus;
  overdue?:   boolean;
  controlId?: string;
  auditId?:   string;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const findingsService = {
  /** List findings for the org with optional filters */
  list(params?: ListFindingsParams): Promise<FindingRecord[]> {
    const qs = new URLSearchParams();
    if (params?.severity)  qs.set('severity',  params.severity);
    if (params?.status)    qs.set('status',    params.status);
    if (params?.overdue)   qs.set('overdue',   'true');
    if (params?.controlId) qs.set('controlId', params.controlId);
    if (params?.auditId)   qs.set('auditId',   params.auditId);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get(`/api/findings${query}`);
  },

  /** Findings assigned to the current user (for My Security Tasks) */
  myTasks(): Promise<FindingRecord[]> {
    return apiClient.get('/api/findings/my-tasks');
  },

  /** Single finding by id */
  get(id: string): Promise<FindingRecord> {
    return apiClient.get(`/api/findings/${id}`);
  },

  /** Create a new finding */
  create(data: CreateFindingRequest): Promise<FindingRecord> {
    return apiClient.post('/api/findings', data);
  },

  /** Update plan / dueDate / assignedTo */
  update(id: string, data: UpdateFindingRequest): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}`, data);
  },

  /** OPEN → IN_REMEDIATION */
  startRemediation(id: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/start-remediation`, {});
  },

  /** IN_REMEDIATION → READY_FOR_REVIEW */
  submitForReview(id: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/submit-review`, {});
  },

  /** READY_FOR_REVIEW → CLOSED (auditor/admin only) */
  accept(id: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/accept`, {});
  },

  /** READY_FOR_REVIEW → OPEN (auditor/admin only) */
  reject(id: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/reject`, {});
  },

  /** Attach evidence URL */
  attachEvidence(id: string, evidenceUrl: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/evidence`, { evidenceUrl });
  },
};
