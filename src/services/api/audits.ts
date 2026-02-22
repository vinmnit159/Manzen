import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditType    = 'INTERNAL' | 'EXTERNAL' | 'SURVEILLANCE' | 'RECERTIFICATION';
export type AuditStatus  = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
export type AuditControlStatus = 'PENDING' | 'REVIEWED' | 'FLAGGED' | 'NOT_APPLICABLE';

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
  findings:             AuditFindingRecord[];
  auditControls?:       AuditControlRecord[];
  _count?:              { auditControls: number };
}

export interface AuditFindingRecord {
  id:          string;
  auditId:     string;
  controlId:   string;
  severity:    'MINOR' | 'MAJOR' | 'OBSERVATION';
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
    id:          string;
    isoReference: string;
    title:       string;
    status:      string;
    description?: string;
  };
}

export interface CreateAuditPayload {
  name:                 string;
  type:                 AuditType;
  frameworkName?:       string;
  periodStart?:         string;
  periodEnd?:           string;
  startDate:            string;
  endDate?:             string;
  assignedAuditorId?:   string;
  externalAuditorEmail?: string;
  controlIds?:          string[];
  allControls?:         boolean;
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
};
