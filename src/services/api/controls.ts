import { apiClient, ApiResponse, PaginatedResponse } from './client';
import { 
  Control, 
  CreateControlRequest, 
  UpdateControlRequest,
  ControlStatus,
  Evidence
} from './types';

// Create unauthenticated client for POC
class UnauthenticatedClient {
  private baseURL: string;

  constructor(baseURL: string = 'https://isms-backend-production.up.railway.app') {
    this.baseURL = baseURL;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // For POC development, always return mock data
    console.log('🚀 POC Mode: Using mock data for', endpoint);
    
    if (endpoint === '/api/controls') {
      return {
        success: true,
        data: this.getMockControls(),
      } as T;
    }
    
    return {
      success: true,
      data: [],
    } as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      // Remove undefined parameters
      const cleanParams: Record<string, string> = {};
      Object.entries(params).forEach(([key, value]) => {
        if (value && value !== 'undefined') {
          cleanParams[key] = value;
        }
      });
      
      const searchParams = new URLSearchParams(cleanParams);
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url);
  }

  // Mock data for development when CORS fails
  private getMockControls() {
    return [
      {
        id: '1',
        isoReference: 'A.5.1',
        title: 'Policies for information security',
        description: 'Information security policy shall be defined, approved by management, published and communicated.',
        status: 'NOT_IMPLEMENTED',
        organizationId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        isoReference: 'A.5.2',
        title: 'Information security roles and responsibilities',
        description: 'Information security roles and responsibilities shall be defined and allocated.',
        status: 'PARTIALLY_IMPLEMENTED',
        organizationId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        isoReference: 'A.8.1',
        title: 'User endpoint devices',
        description: 'Endpoint devices shall be protected.',
        status: 'IMPLEMENTED',
        organizationId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '4',
        isoReference: 'A.8.7',
        title: 'Protection against malware',
        description: 'Protection against malware shall be implemented.',
        status: 'NOT_IMPLEMENTED',
        organizationId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '5',
        isoReference: 'A.9.1',
        title: 'Access control',
        description: 'Access to information shall be restricted based on business requirements.',
        status: 'PARTIALLY_IMPLEMENTED',
        organizationId: 'demo-org',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

const unauthClient = new UnauthenticatedClient();

export class ControlsService {
  // Get all controls (without authentication for POC)
  async getControls(params?: {
    page?: number;
    limit?: number;
    status?: ControlStatus;
    search?: string;
    isoReference?: string;
  }): Promise<ApiResponse<Control[]>> {
    return unauthClient.get('/api/controls', params);
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