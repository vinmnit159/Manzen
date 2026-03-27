import { apiClient, ApiResponse } from './client';

export interface ComplianceDocumentDto {
  id: string;
  testId: string | null;
  name: string;
  slug: string;
  category: string;
  frameworkId: string | null;
  frameworkName: string | null;
  status: 'PENDING' | 'CURRENT' | 'NEEDS_REVIEW' | 'EXPIRED';
  currentEvidenceId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  lastReviewedAt: string | null;
  reviewDueAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceDocumentStats {
  total: number;
  pending: number;
  current: number;
  needsReview: number;
  expired: number;
}

export interface ComplianceDocumentListResponse extends ApiResponse<ComplianceDocumentDto[]> {
  stats: ComplianceDocumentStats;
}

export interface UpdateComplianceDocumentRequest {
  status?: string;
  ownerId?: string | null;
  currentEvidenceId?: string | null;
  lastReviewedAt?: string | null;
  reviewDueAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export const complianceDocumentService = {
  list(params?: { status?: string; category?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return apiClient.get<ComplianceDocumentListResponse>(
      `/api/compliance-documents${query ? `?${query}` : ''}`,
    );
  },

  update(id: string, data: UpdateComplianceDocumentRequest) {
    return apiClient.patch<ApiResponse<ComplianceDocumentDto>>(
      `/api/compliance-documents/${id}`,
      data,
    );
  },
};
