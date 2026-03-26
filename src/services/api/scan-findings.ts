import { apiClient, ApiResponse } from './client';

export interface ScanFindingDto {
  id: string;
  sourceType: string;
  findingTypeKey: string;
  title: string;
  description: string | null;
  severity: string;
  status: 'OPEN' | 'RESOLVED' | 'SUPPRESSED';
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  sourceRef: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
}

export interface FindingsMeta {
  total: number;
  open: number;
  resolved: number;
}

export interface FindingsListResponse extends ApiResponse<ScanFindingDto[]> {
  meta: FindingsMeta;
}

export const scanFindingsService = {
  listByRisk(riskId: string) {
    return apiClient.get<FindingsListResponse>(
      `/risk-library/register/${riskId}/findings`,
    );
  },

  list(params?: { source_type?: string; status?: string; finding_type_key?: string }) {
    const qs = new URLSearchParams();
    if (params?.source_type) qs.set('source_type', params.source_type);
    if (params?.status) qs.set('status', params.status);
    if (params?.finding_type_key) qs.set('finding_type_key', params.finding_type_key);
    const query = qs.toString();
    return apiClient.get<ApiResponse<ScanFindingDto[]>>(
      `/scan-findings${query ? `?${query}` : ''}`,
    );
  },

  getById(id: string) {
    return apiClient.get<ApiResponse<ScanFindingDto>>(`/scan-findings/${id}`);
  },
};
