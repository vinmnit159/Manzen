import { apiClient, ApiResponse } from './client';
import { Policy } from './types';

export interface CreatePolicyRequest {
  name: string;
  version: string;
  status: string;
  documentUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export type UpdatePolicyRequest = Partial<CreatePolicyRequest>;

export class PoliciesService {
  // Get all policies
  async getPolicies(params?: {
    search?: string;
    status?: string;
  }): Promise<ApiResponse<Policy[]>> {
    const cleanParams: Record<string, string> = {};
    if (params?.search) cleanParams.search = params.search;
    if (params?.status) cleanParams.status = params.status;
    return apiClient.get(
      '/api/policies',
      Object.keys(cleanParams).length ? cleanParams : undefined
    );
  }

  // Get single policy
  async getPolicy(id: string): Promise<ApiResponse<Policy>> {
    return apiClient.get(`/api/policies/${id}`);
  }

  // Create policy
  async createPolicy(data: CreatePolicyRequest): Promise<ApiResponse<Policy>> {
    return apiClient.post('/api/policies', data);
  }

  // Update policy
  async updatePolicy(id: string, data: UpdatePolicyRequest): Promise<ApiResponse<Policy>> {
    return apiClient.put(`/api/policies/${id}`, data);
  }

  // Delete policy
  async deletePolicy(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/policies/${id}`);
  }
}

export const policiesService = new PoliciesService();
