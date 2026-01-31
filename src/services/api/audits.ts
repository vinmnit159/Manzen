import { apiClient, ApiResponse } from './client';
import { 
  Audit, 
  AuditFinding,
  AuditType,
  FindingSeverity 
} from './types';

export class AuditsService {
  // Get all audits
  async getAudits(params?: {
    type?: AuditType;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApiResponse<Audit[]>> {
    return apiClient.get('/api/audits', params);
  }

  // Get audit by ID
  async getAudit(id: string): Promise<ApiResponse<Audit>> {
    return apiClient.get(`/api/audits/${id}`);
  }

  // Create new audit
  async createAudit(auditData: {
    type: AuditType;
    auditor: string;
    scope: string;
    startDate: string;
    endDate?: string;
  }): Promise<ApiResponse<Audit>> {
    return apiClient.post('/api/audits', auditData);
  }

  // Update audit
  async updateAudit(id: string, auditData: Partial<{
    auditor: string;
    scope: string;
    startDate: string;
    endDate: string;
    status: string;
  }>): Promise<ApiResponse<Audit>> {
    return apiClient.put(`/api/audits/${id}`, auditData);
  }

  // Delete audit
  async deleteAudit(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/audits/${id}`);
  }

  // Get audit findings
  async getAuditFindings(auditId: string): Promise<ApiResponse<AuditFinding[]>> {
    return apiClient.get(`/api/audits/${auditId}/findings`);
  }

  // Add audit finding
  async addFinding(auditId: string, findingData: {
    controlId: string;
    severity: FindingSeverity;
    description: string;
    remediation?: string;
  }): Promise<ApiResponse<AuditFinding>> {
    return apiClient.post(`/api/audits/${auditId}/findings`, findingData);
  }

  // Update audit finding
  async updateFinding(findingId: string, findingData: Partial<{
    severity: FindingSeverity;
    description: string;
    remediation: string;
    status: string;
  }>): Promise<ApiResponse<AuditFinding>> {
    return apiClient.put(`/api/audits/findings/${findingId}`, findingData);
  }

  // Delete audit finding
  async deleteFinding(findingId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/audits/findings/${findingId}`);
  }

  // Generate audit report
  async generateAuditReport(auditId: string, format: 'pdf' | 'docx' | 'html' = 'pdf'): Promise<Blob> {
    const response = await fetch(`${apiClient.baseURL}/api/audits/${auditId}/report?format=${format}`, {
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to generate audit report');
    }
    
    return response.blob();
  }

  // Get audit statistics
  async getAuditStats(period?: 'month' | 'quarter' | 'year'): Promise<ApiResponse<{
    total: number;
    internal: number;
    external: number;
    surveillance: number;
    completed: number;
    inProgress: number;
    findingsBySeverity: {
      severity: FindingSeverity;
      count: number;
    }[];
  }>> {
    const url = period ? `/api/audits/stats?period=${period}` : '/api/audits/stats';
    return apiClient.get(url);
  }

  // Schedule audit
  async scheduleAudit(auditData: {
    type: AuditType;
    auditor: string;
    scope: string;
    scheduledDate: string;
    frequency?: 'monthly' | 'quarterly' | 'annually';
  }): Promise<ApiResponse<Audit>> {
    return apiClient.post('/api/audits/schedule', auditData);
  }

  // Get scheduled audits
  async getScheduledAudits(): Promise<ApiResponse<Audit[]>> {
    return apiClient.get('/api/audits/scheduled');
  }

  // Close audit
  async closeAudit(auditId: string, closingData?: {
    summary?: string;
    recommendations?: string[];
    nextAuditDate?: string;
  }): Promise<ApiResponse<Audit>> {
    return apiClient.post(`/api/audits/${auditId}/close`, closingData);
  }

  // Export audit data
  async exportAudits(format: 'csv' | 'xlsx' | 'pdf' = 'csv', params?: {
    startDate?: string;
    endDate?: string;
    type?: AuditType;
  }): Promise<Blob> {
    const queryParams = new URLSearchParams({ format, ...params });
    const response = await fetch(`${apiClient.baseURL}/api/audits/export?${queryParams}`, {
      headers: apiClient.token ? {
        Authorization: `Bearer ${apiClient.token}`,
      } : {},
    });
    
    if (!response.ok) {
      throw new Error('Failed to export audits');
    }
    
    return response.blob();
  }
}

export const auditsService = new AuditsService();