import { apiClient } from './client';

// ── Control Template types ──────────────────────────────────────────────────

export interface ControlTemplateDto {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  domain: string;
  testGuidance: string | null;
  defaultFrequency: string;
  createdAt: string;
  updatedAt: string;
  mappingCount: number;
}

export interface TemplateMappingDto {
  id: string;
  frameworkId: string;
  frameworkSlug: string;
  frameworkName: string;
  requirementCode: string;
  requirementTitle: string;
  requirementDomain: string | null;
  mappingStrength: string;
}

export interface ControlTemplateDetailDto extends Omit<ControlTemplateDto, 'mappingCount'> {
  mappings: TemplateMappingDto[];
}

export interface CreateTemplateRequest {
  referenceCode: string;
  title: string;
  description: string;
  domain: string;
  testGuidance?: string;
  defaultFrequency?: string;
}

export interface UpdateTemplateRequest {
  referenceCode?: string;
  title?: string;
  description?: string;
  domain?: string;
  testGuidance?: string;
  defaultFrequency?: string;
}

export interface AddTemplateMappingRequest {
  frameworkRequirementId: string;
  frameworkId: string;
  mappingStrength?: string;
}

// ── Organization types ──────────────────────────────────────────────────────

export interface OrgListDto {
  id: string;
  name: string;
  createdAt: string;
  userCount: number;
  controlCount: number;
  policyCount: number;
  activeFrameworks: number;
}

export interface OrgDetailDto {
  id: string;
  name: string;
  createdAt: string;
  users: Array<{ id: string; email: string; name: string | null; role: string; createdAt: string }>;
  frameworks: Array<{ id: string; slug: string; name: string; version: string; status: string; activatedAt: string | null }>;
  counts: { controls: number; policies: number; risks: number };
}

export interface CreateOrgRequest {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

// ── Admin API service ───────────────────────────────────────────────────────

class AdminService {
  // Templates
  async listTemplates(): Promise<{ success: boolean; data: ControlTemplateDto[] }> {
    return apiClient.get('/api/admin/templates');
  }

  async getTemplate(id: string): Promise<{ success: boolean; data: ControlTemplateDetailDto }> {
    return apiClient.get(`/api/admin/templates/${id}`);
  }

  async createTemplate(body: CreateTemplateRequest): Promise<{ success: boolean; data: ControlTemplateDto }> {
    return apiClient.post('/api/admin/templates', body);
  }

  async updateTemplate(id: string, body: UpdateTemplateRequest): Promise<{ success: boolean; data: ControlTemplateDto }> {
    return apiClient.put(`/api/admin/templates/${id}`, body);
  }

  async deleteTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/templates/${id}`);
  }

  async addTemplateMapping(templateId: string, body: AddTemplateMappingRequest): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/admin/templates/${templateId}/mappings`, body);
  }

  async removeTemplateMapping(templateId: string, mappingId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/admin/templates/${templateId}/mappings/${mappingId}`);
  }

  // Organizations
  async listOrganizations(): Promise<{ success: boolean; data: OrgListDto[] }> {
    return apiClient.get('/api/admin/organizations');
  }

  async getOrganization(orgId: string): Promise<{ success: boolean; data: OrgDetailDto }> {
    return apiClient.get(`/api/admin/organizations/${orgId}`);
  }

  async createOrganization(body: CreateOrgRequest): Promise<{ success: boolean; data: { organization: { id: string; name: string; createdAt: string }; admin: { id: string; email: string; name: string; role: string } } }> {
    return apiClient.post('/api/admin/organizations', body);
  }
}

export const adminService = new AdminService();
