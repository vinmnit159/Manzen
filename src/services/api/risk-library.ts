import { apiClient, ApiResponse } from './client';

export interface RiskLibraryItemDto {
  id: string;
  title: string;
  category: string;
  defaultImpact: string;
  defaultLikelihood: string;
}

export interface RiskRegisterEntryDto {
  id: string;
  libraryItemId: string | null;
  title: string;
  description: string | null;
  category: string;
  inherentImpact: string;
  inherentLikelihood: string;
  inherentScore: number;
  residualImpact: string | null;
  residualLikelihood: string | null;
  residualScore: number | null;
  status: 'IDENTIFIED' | 'ASSESSING' | 'TREATING' | 'MONITORING' | 'CLOSED';
  treatment: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | null;
  treatmentNotes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  reviewDueAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskRegisterStats {
  total: number;
  identified: number;
  assessing: number;
  treating: number;
  monitoring: number;
  closed: number;
}

export interface RiskLibraryListResponse extends ApiResponse<RiskLibraryItemDto[]> {
  categories: string[];
}

export interface RiskRegisterListResponse extends ApiResponse<RiskRegisterEntryDto[]> {
  stats: RiskRegisterStats;
}

export interface AddToRegisterRequest {
  libraryItemId?: string;
  title?: string;
  description?: string;
  category?: string;
  inherentImpact?: string;
  inherentLikelihood?: string;
}

export interface UpdateRegisterEntryRequest {
  inherentImpact?: string;
  inherentLikelihood?: string;
  residualImpact?: string;
  residualLikelihood?: string;
  status?: string;
  treatment?: string;
  treatmentNotes?: string;
  ownerId?: string | null;
  reviewDueAt?: string | null;
  description?: string;
}

export const riskLibraryService = {
  listLibrary() {
    return apiClient.get<RiskLibraryListResponse>('/risk-library');
  },

  listRegister(params?: { status?: string; category?: string; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.category) qs.set('category', params.category);
    if (params?.search) qs.set('search', params.search);
    const query = qs.toString();
    return apiClient.get<RiskRegisterListResponse>(
      `/risk-library/register${query ? `?${query}` : ''}`,
    );
  },

  addToRegister(data: AddToRegisterRequest) {
    return apiClient.post<ApiResponse<RiskRegisterEntryDto>>(
      '/risk-library/register',
      data,
    );
  },

  updateRegisterEntry(id: string, data: UpdateRegisterEntryRequest) {
    return apiClient.patch<ApiResponse<RiskRegisterEntryDto>>(
      `/risk-library/register/${id}`,
      data,
    );
  },

  removeFromRegister(id: string) {
    return apiClient.delete<ApiResponse>(`/risk-library/register/${id}`);
  },
};
