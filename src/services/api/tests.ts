import { apiClient, ApiResponse, PaginatedResponse } from './client';

// ─── Enums ────────────────────────────────────────────────────────────────────
export type TestCategory = 'Custom' | 'Engineering' | 'HR' | 'IT' | 'Policy' | 'Risks';
export type TestType = 'Document' | 'Automated';
export type TestStatus = 'Due_soon' | 'Needs_remediation' | 'OK' | 'Overdue';

// ─── Related record shapes ────────────────────────────────────────────────────
export interface TestControlLink {
  id: string;
  controlId: string;
  control: { id: string; isoReference: string; title: string; status: string };
}

export interface TestFrameworkLink {
  id: string;
  testId: string;
  frameworkName: string;
}

export interface TestAuditLink {
  id: string;
  auditId: string;
  audit: { id: string; type: string; auditor: string; scope: string };
}

export interface TestEvidenceLink {
  id: string;
  evidenceId: string;
  evidence: {
    id: string;
    type: string;
    fileName: string | null;
    fileUrl: string | null;
    createdAt: string;
  };
}

// ─── Core test record ─────────────────────────────────────────────────────────
export interface TestRecord {
  id: string;
  name: string;
  category: TestCategory;
  type: TestType;
  status: TestStatus;
  ownerId: string;
  owner?: { id: string; name: string; email: string };
  dueDate: string;
  completedAt: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  controls: TestControlLink[];
  frameworks: TestFrameworkLink[];
  audits: TestAuditLink[];
  evidences: TestEvidenceLink[];
}

// ─── Summary ──────────────────────────────────────────────────────────────────
export interface TestSummary {
  total: number;
  completed: number;
  passPercentage: number;
  overdue: number;
  dueSoon: number;
}

// ─── History ──────────────────────────────────────────────────────────────────
export interface TestHistoryEntry {
  id: string;
  testId: string;
  changedBy: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

// ─── List params ─────────────────────────────────────────────────────────────
export interface ListTestsParams {
  page?: number;
  limit?: number;
  category?: TestCategory | '';
  status?: TestStatus | '';
  type?: TestType | '';
  ownerId?: string;
  search?: string;
  dueFrom?: string;
  dueTo?: string;
}

// ─── Create / update payloads ─────────────────────────────────────────────────
export interface CreateTestRequest {
  name: string;
  category: TestCategory;
  type: TestType;
  ownerId: string;
  dueDate: string;
}

export interface UpdateTestRequest {
  name?: string;
  category?: TestCategory;
  type?: TestType;
  ownerId?: string;
  dueDate?: string;
  status?: TestStatus;
}

// ─── Service ─────────────────────────────────────────────────────────────────
export class TestsService {
  async listTests(params?: ListTestsParams): Promise<ApiResponse<TestRecord[]>> {
    const clean: Record<string, string> = {};
    if (params) {
      if (params.search)   clean.search   = params.search;
      if (params.category) clean.category = params.category;
      if (params.status)   clean.status   = params.status;
      if (params.type)     clean.type     = params.type;
      if (params.ownerId)  clean.ownerId  = params.ownerId;
      if (params.dueFrom)  clean.dueFrom  = params.dueFrom;
      if (params.dueTo)    clean.dueTo    = params.dueTo;
      if (params.page   !== undefined) clean.page  = String(params.page);
      if (params.limit  !== undefined) clean.limit = String(params.limit);
    }
    return apiClient.get('/api/tests', Object.keys(clean).length ? clean : undefined);
  }

  async getTestSummary(): Promise<ApiResponse<TestSummary>> {
    return apiClient.get('/api/tests/summary');
  }

  async getTest(id: string): Promise<ApiResponse<TestRecord>> {
    return apiClient.get(`/api/tests/${id}`);
  }

  async createTest(data: CreateTestRequest): Promise<ApiResponse<TestRecord>> {
    return apiClient.post('/api/tests', data);
  }

  async updateTest(id: string, data: UpdateTestRequest): Promise<ApiResponse<TestRecord>> {
    return apiClient.put(`/api/tests/${id}`, data);
  }

  async deleteTest(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${id}`);
  }

  async completeTest(id: string): Promise<ApiResponse<TestRecord>> {
    return apiClient.post(`/api/tests/${id}/complete`, {});
  }

  // Evidence
  async attachEvidence(testId: string, evidenceId: string): Promise<ApiResponse<TestEvidenceLink>> {
    return apiClient.post(`/api/tests/${testId}/evidence`, { evidenceId });
  }

  async detachEvidence(testId: string, evidenceId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/evidence/${evidenceId}`);
  }

  // Controls
  async attachControl(testId: string, controlId: string): Promise<ApiResponse<TestControlLink>> {
    return apiClient.post(`/api/tests/${testId}/controls`, { controlId });
  }

  async detachControl(testId: string, controlId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/controls/${controlId}`);
  }

  // Audits
  async attachAudit(testId: string, auditId: string): Promise<ApiResponse<TestAuditLink>> {
    return apiClient.post(`/api/tests/${testId}/audits`, { auditId });
  }

  async detachAudit(testId: string, auditId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/audits/${auditId}`);
  }

  // Frameworks
  async attachFramework(testId: string, frameworkName: string): Promise<ApiResponse<TestFrameworkLink>> {
    return apiClient.post(`/api/tests/${testId}/frameworks`, { frameworkName });
  }

  async detachFramework(testId: string, frameworkId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/api/tests/${testId}/frameworks/${frameworkId}`);
  }

  // History
  async getHistory(testId: string, page = 1): Promise<ApiResponse<TestHistoryEntry[]>> {
    return apiClient.get(`/api/tests/${testId}/history`, { page: String(page) });
  }

  // Seed predefined Policy tests
  async seedTests(): Promise<ApiResponse<{ created: number; skipped: number }>> {
    return apiClient.post('/api/tests/seed', {});
  }
}

export const testsService = new TestsService();
