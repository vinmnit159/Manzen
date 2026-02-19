import { apiClient, ApiResponse } from './client';
import { Policy } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

  /**
   * Upload a document file for a policy.
   * Sends multipart/form-data with a single "file" field.
   */
  async uploadPolicyDocument(policyId: string, file: File): Promise<ApiResponse<{ policy: Policy; file: { fileName: string; fileUrl: string; size: number; mimeType: string } }>> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('isms_token');
    const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return data;
  }

  /**
   * Download a policy document. Returns a Blob for the browser to save.
   * Uses the authenticated /api/policies/:id/download endpoint.
   */
  async downloadPolicyDocument(policyId: string, fileName: string): Promise<void> {
    const token = localStorage.getItem('isms_token');
    const response = await fetch(`${API_BASE_URL}/api/policies/${policyId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const policiesService = new PoliciesService();
