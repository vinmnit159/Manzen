import { apiClient, API_BASE_URL } from './client';
import { getAuthToken } from '@/services/authStorage';

export interface GitHubRepoScanResult {
  compliant: boolean | null;
  [key: string]: unknown;
}

export interface GitHubRepoBranchProtection {
  result?: GitHubRepoScanResult;
  enabled?: boolean;
  requiredReviewsEnabled?: boolean;
  requiredApprovingReviewCount?: number;
  [key: string]: unknown;
}

export interface GitHubRepoRawData {
  branchProtection?: GitHubRepoBranchProtection;
  protection?: GitHubRepoBranchProtection;
  commitSigning?: { result?: GitHubRepoScanResult };
  cicd?: { result?: GitHubRepoScanResult };
  accessControl?: { result?: GitHubRepoScanResult };
  repoMeta?: { result?: GitHubRepoScanResult };
  branchProtectionEnabled?: boolean;
  requiredApprovingReviewCount?: number;
  secretScanningEnabled?: boolean;
  secretScanning?: boolean;
  pushProtectionEnabled?: boolean;
  secretScanningPushProtection?: boolean;
  [key: string]: unknown;
}

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  visibility: string;
  lastScannedAt: string | null;
  rawData: GitHubRepoRawData;
}

export interface TriggerGitHubScanRequest {
  integrationId?: string;
  organizationId?: string;
  repos?: GitHubRepo[];
}

export interface Integration {
  id: string;
  provider: string;
  status: 'ACTIVE' | 'DISCONNECTED';
  createdAt: string;
  updatedAt: string;
  repos: GitHubRepo[];
}

export interface AutomatedTestResult {
  id: string;
  name: string;
  status: string;
  lastResult: 'Pass' | 'Fail' | 'Warning' | 'Not_Run';
  lastRunAt: string | null;
  lastResultDetails: Record<string, unknown> | null;
}

export interface TestRunRecord {
  id: string;
  testId: string;
  integrationId: string;
  status: 'Pass' | 'Fail' | 'Warning';
  summary: string;
  executedAt: string;
  durationMs: number;
  rawPayload: Record<string, unknown>;
}

export const integrationsService = {
  async getStatus(): Promise<{ integrations: Integration[] }> {
    return apiClient.get('/api/integrations/status');
  },
  async getGitHubRepos(): Promise<{ repos: GitHubRepo[] }> {
    return apiClient.get('/api/integrations/github/repos');
  },
  async triggerScan(payload?: TriggerGitHubScanRequest): Promise<{
    success: boolean;
    message: string;
    data?: { signals: number; testResults: number; risks: number };
  }> {
    return apiClient.post('/api/integrations/github/scan', payload ?? {});
  },
  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/api/integrations/github');
  },
  /** Trigger an automated test run (background — returns immediately) */
  async runAutomatedTests(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/api/integrations/github/run-tests', {});
  },
  /** List automated tests seeded for this org's GitHub integration */
  async getAutomatedTests(): Promise<{
    success: boolean;
    data: AutomatedTestResult[];
    seeded: boolean;
  }> {
    return apiClient.get('/api/integrations/github/tests');
  },
  getConnectUrl(): string {
    const token = getAuthToken() ?? '';
    return `${API_BASE_URL}/api/integrations/github/connect?token=${encodeURIComponent(token)}`;
  },
  getDriveConnectUrl(): string {
    const token = getAuthToken() ?? '';
    return `${API_BASE_URL}/api/integrations/google/connect?token=${encodeURIComponent(token)}`;
  },
  async disconnectDrive(): Promise<{ success: boolean }> {
    return apiClient.delete('/api/integrations/google');
  },
};
