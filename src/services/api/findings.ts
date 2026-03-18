import { apiClient } from './client';

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingStatus =
  | 'OPEN'
  | 'IN_REMEDIATION'
  | 'READY_FOR_REVIEW'
  | 'CLOSED';

export interface FindingRemediationRecord {
  id: string;
  findingId: string;
  organizationId: string;
  note: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
}

export interface FindingRecord {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  severity: FindingSeverity;
  status: FindingStatus;
  controlId: string | null;
  testRunId: string | null;
  assetId: string | null;
  riskId: string | null;
  remediationOwner: string | null;
  dueAt: string | null;
  sourceType: 'TEST_RUN' | 'AUDIT' | 'MANUAL';
  createdAt: string;
  updatedAt: string;
  ageInDays?: number;
  slaBreached?: boolean;
  control?: { id: string; isoReference: string; title: string } | null;
  asset?: { id: string; name: string; type: string } | null;
  risk?: { id: string; title: string; status: string } | null;
  testRun?: {
    id: string;
    status: 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
    executedAt: string;
    summary: string;
    executionSource?: string | null;
    executedBy?: string | null;
    assetId?: string | null;
    correlationId?: string | null;
    startedAt?: string | null;
    durationMs?: number | null;
  } | null;
  remediations?: FindingRemediationRecord[];
}

export interface ListFindingsParams {
  severity?: FindingSeverity;
  status?: FindingStatus;
  controlId?: string;
  assetId?: string;
  remediationOwner?: string;
  sourceType?: 'TEST_RUN' | 'AUDIT' | 'MANUAL';
}

export interface UpdateFindingRequest {
  status?: FindingStatus;
  dueAt?: string | null;
  remediationOwner?: string | null;
}

export const findingsService = {
  list(params?: ListFindingsParams): Promise<FindingRecord[]> {
    const qs = new URLSearchParams();
    if (params?.severity) qs.set('severity', params.severity);
    if (params?.status) qs.set('status', params.status);
    if (params?.controlId) qs.set('controlId', params.controlId);
    if (params?.assetId) qs.set('assetId', params.assetId);
    if (params?.remediationOwner)
      qs.set('remediationOwner', params.remediationOwner);
    if (params?.sourceType) qs.set('sourceType', params.sourceType);
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return apiClient.get(`/api/findings${query}`);
  },

  myTasks(): Promise<FindingRecord[]> {
    return apiClient.get('/api/findings/my-tasks');
  },

  get(id: string): Promise<FindingRecord> {
    return apiClient.get(`/api/findings/${id}`);
  },

  update(id: string, data: UpdateFindingRequest): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, data);
  },

  addRemediation(id: string, note: string): Promise<FindingRecord> {
    return apiClient.post(`/api/findings/${id}/remediation`, { note });
  },

  startRemediation(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, {
      status: 'IN_REMEDIATION',
    });
  },

  submitForReview(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, {
      status: 'READY_FOR_REVIEW',
    });
  },

  accept(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, { status: 'CLOSED' });
  },

  reject(id: string): Promise<FindingRecord> {
    return apiClient.patch(`/api/findings/${id}/status`, { status: 'OPEN' });
  },
};
