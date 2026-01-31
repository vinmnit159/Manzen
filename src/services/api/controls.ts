import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { 
  Control, 
  CreateControlRequest, 
  UpdateControlRequest,
  ControlStatus,
  Evidence
} from './types';

export class ControlsService {
  // Get all controls
  async getControls(params?: {
    page?: number;
    limit?: number;
    status?: ControlStatus;
    search?: string;
    isoReference?: string;
  }): Promise<ApiResponse<Control[]>> {
    return apiClient.get('/api/controls', params);
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

  // Get controls with evidence
  async getControlsWithEvidence(): Promise<ApiResponse<Control[]>> {
    return apiClient.get('/api/controls/with-evidence');
  }

  // Get control by ISO reference
  async getControlsByISOReference(reference: string): Promise<ApiResponse<Control[]>> {
    return apiClient.get(`/api/controls/iso/${reference}`);
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

  // Get ISO 27001 controls
  async getISOControls(): Promise<ApiResponse<{
    clause: string;
    controls: Control[];
  }[]>> {
    return apiClient.get('/api/controls/iso27001');
  }

  // Get control gaps
  async getControlGaps(): Promise<ApiResponse<{
    isoReference: string;
    title: string;
    status: ControlStatus;
    risks: number;
    recommendations: string[];
  }[]>> {
    return apiClient.get('/api/controls/gaps');
  }

  // Implement control
  async implementControl(id: string, implementationData: {
    justification?: string;
    evidence?: any[];
  }): Promise<ApiResponse<Control>> {
    return apiClient.post(`/api/controls/${id}/implement`, implementationData);
  }

  // Automated control check
  async runAutomatedCheck(id: string): Promise<ApiResponse<{
    status: 'passed' | 'failed' | 'warning';
    details: any[];
    recommendations?: string[];
  }>> {
    return apiClient.post(`/api/controls/${id}/check`);
  }

  // Export controls
  async exportControls(format: 'csv' | 'xlsx' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(`${apiClient.baseURL}/api/controls/export?format=${format}`, {
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to export controls');
    }
    
    return response.blob();
  }

  // Sync with framework
  async syncWithFramework(frameworkId: string, controlIds: string[]): Promise<ApiResponse<{
    synced: number;
    failed: number;
    errors?: any[];
  }>> {
    return apiClient.post('/api/controls/sync', { frameworkId, controlIds });
  }
}

export const controlsService = new ControlsService();