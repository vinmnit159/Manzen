import { apiClient, ApiResponse, PaginatedResponse } from './client';
import {
  Control,
  CreateControlRequest,
  UpdateControlRequest,
  ControlStatus,
  Evidence
} from './types';

export class ControlsService {
  // Get all controls (authenticated)
  async getControls(params?: {
    page?: number;
    limit?: number;
    status?: ControlStatus;
    search?: string;
    isoReference?: string;
  }): Promise<ApiResponse<Control[]>> {
    // Build clean params - omit undefined/empty values
    const cleanParams: Record<string, string> = {};
    if (params) {
      if (params.search) cleanParams.search = params.search;
      if (params.status) cleanParams.status = params.status;
      if (params.isoReference) cleanParams.isoReference = params.isoReference;
      if (params.page !== undefined) cleanParams.page = String(params.page);
      if (params.limit !== undefined) cleanParams.limit = String(params.limit);
    }
    return apiClient.get('/api/controls', Object.keys(cleanParams).length ? cleanParams : undefined);
  }

  // Get control by ID
  async getControl(id: string): Promise<ApiResponse<Control>> {
    return apiClient.get(`/api/controls/${id}`);
  }

  // Create new control
  async createControl(controlData: CreateControlRequest): Promise<ApiResponse<Control>> {
    return apiClient.post('/api/controls', controlData);
  }

  // Update control
  async updateControl(id: string, controlData: UpdateControlRequest): Promise<ApiResponse<Control>> {
    return apiClient.put(`/api/controls/${id}`, controlData);
  }

  // Delete control
  async deleteControl(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/controls/${id}`);
  }

  // Get control compliance status
  async getControlCompliance(): Promise<ApiResponse<{
    total: number;
    implemented: number;
    partiallyImplemented: number;
    notImplemented: number;
    compliancePercentage: number;
  }>> {
    return apiClient.get('/api/controls/compliance');
  }

  // Add evidence to control
  async addEvidence(controlId: string, evidenceData: {
    type: string;
    fileName?: string;
    fileUrl?: string;
    automated?: boolean;
  }): Promise<ApiResponse<Evidence>> {
    return apiClient.post(`/api/controls/${controlId}/evidence`, evidenceData);
  }

  // Remove evidence from control
  async removeEvidence(controlId: string, evidenceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/controls/${controlId}/evidence/${evidenceId}`);
  }

  // Export controls
  async exportControls(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const token = localStorage.getItem('isms_token');
    const baseURL = (apiClient as any).baseURL || 'https://isms-backend-production.up.railway.app';
    const response = await fetch(`${baseURL}/api/controls/export?format=${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to export controls');
    }

    return response.blob();
  }
}

export const controlsService = new ControlsService();
