import { apiClient, ApiResponse } from './client';
import { 
  Evidence, 
  CreateEvidenceRequest,
  EvidenceType 
} from './types';

export class EvidenceService {
  // Get all evidence
  async getEvidence(params?: {
    controlId?: string;
    type?: EvidenceType;
    automated?: boolean;
    search?: string;
  }): Promise<ApiResponse<Evidence[]>> {
    return apiClient.get('/api/evidence', params);
  }

  // Get evidence by ID
  async getEvidenceById(id: string): Promise<ApiResponse<Evidence>> {
    return apiClient.get(`/api/evidence/${id}`);
  }

  // Create new evidence
  async createEvidence(evidenceData: CreateEvidenceRequest): Promise<ApiResponse<Evidence>> {
    return apiClient.post('/api/evidence', evidenceData);
  }

  // Upload evidence file
  async uploadEvidenceFile(file: File, controlId: string): Promise<ApiResponse<Evidence>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('controlId', controlId);
    formData.append('type', 'FILE');

    const response = await fetch(`${apiClient.baseURL}/api/evidence/upload`, {
      method: 'POST',
      body: formData,
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });

    if (!response.ok) {
      throw new Error('Failed to upload evidence file');
    }

    return response.json();
  }

  // Delete evidence
  async deleteEvidence(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/evidence/${id}`);
  }

  // Verify evidence authenticity
  async verifyEvidence(id: string): Promise<ApiResponse<{
    isValid: boolean;
    verificationResult: any;
  }>> {
    return apiClient.post(`/api/evidence/${id}/verify`);
  }

  // Get evidence for control
  async getControlEvidence(controlId: string): Promise<ApiResponse<Evidence[]>> {
    return apiClient.get(`/api/evidence/control/${controlId}`);
  }

  // Get automated evidence
  async getAutomatedEvidence(): Promise<ApiResponse<Evidence[]>> {
    return apiClient.get('/api/evidence/automated');
  }

  // Generate evidence automatically
  async generateEvidence(controlId: string, config: {
    type: 'screenshot' | 'log' | 'api_check';
    schedule?: string;
    parameters?: any;
  }): Promise<ApiResponse<Evidence>> {
    return apiClient.post(`/api/evidence/generate`, {
      controlId,
      ...config,
    });
  }

  // Bulk evidence operations
  async bulkOperation(operation: 'delete' | 'verify', evidenceIds: string[]): Promise<ApiResponse<{
    success: number;
    failed: number;
    errors?: any[];
  }>> {
    return apiClient.post('/api/evidence/bulk', { operation, evidenceIds });
  }

  // Download evidence file
  async downloadEvidence(id: string): Promise<Blob> {
    const response = await fetch(`${apiClient.baseURL}/api/evidence/${id}/download`, {
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to download evidence');
    }
    
    return response.blob();
  }

  // Get evidence statistics
  async getEvidenceStats(controlId?: string): Promise<ApiResponse<{
    total: number;
    automated: number;
    manual: number;
    byType: {
      type: EvidenceType;
      count: number;
    }[];
  }>> {
    const url = controlId ? `/api/evidence/stats/${controlId}` : '/api/evidence/stats';
    return apiClient.get(url);
  }
}

export const evidenceService = new EvidenceService();