import { apiClient } from './client';
import { getAuthToken } from '@/services/authStorage';

export interface GitHubRepo {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  visibility: string;
  lastScannedAt: string | null;
  rawData: any;
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
  lastResultDetails: any;
}

export interface TestRunRecord {
  id: string;
  testId: string;
  integrationId: string;
  status: 'Pass' | 'Fail' | 'Warning';
  summary: string;
  executedAt: string;
  durationMs: number;
  rawPayload: any;
}

export const integrationsService = {
  async getStatus(): Promise<{ integrations: Integration[] }> {
    return apiClient.get('/api/integrations/status');
  },
  async getGitHubRepos(): Promise<{ repos: GitHubRepo[] }> {
    return apiClient.get('/api/integrations/github/repos');
  },
  async triggerScan(
    payload?: TriggerGitHubScanRequest,
  ): Promise<{
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
    const backendUrl =
      (import.meta as any).env?.VITE_API_URL ?? 'https://api.cloudanzen.com';
    const token = getAuthToken() ?? '';
    return `${backendUrl}/api/integrations/github/connect?token=${encodeURIComponent(token)}`;
  },
  getDriveConnectUrl(): string {
    const backendUrl =
      (import.meta as any).env?.VITE_API_URL ?? 'https://api.cloudanzen.com';
    const token = getAuthToken() ?? '';
    return `${backendUrl}/api/integrations/google/connect?token=${encodeURIComponent(token)}`;
  },
  async disconnectDrive(): Promise<{ success: boolean }> {
    return apiClient.delete('/api/integrations/google');
  },
};
