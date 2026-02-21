import { apiClient } from './client';

export interface GitHubRepo {
  id: string; name: string; fullName: string; private: boolean;
  defaultBranch: string; visibility: string; lastScannedAt: string | null; rawData: any;
}

export interface Integration {
  id: string; provider: string; status: 'ACTIVE' | 'DISCONNECTED';
  createdAt: string; updatedAt: string; repos: GitHubRepo[];
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
    return apiClient.get('/integrations/status');
  },
  async getGitHubRepos(): Promise<{ repos: GitHubRepo[] }> {
    return apiClient.get('/integrations/github/repos');
  },
  async triggerScan(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/integrations/github/scan', {});
  },
  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/github');
  },
  /** Seed the 13 predefined GitHub automated Engineering tests */
  async seedAutomatedTests(): Promise<{ success: boolean; data: { created: number; skipped: number } }> {
    return apiClient.post('/integrations/github/seed-tests', {});
  },
  /** Trigger an automated test run (background — returns immediately) */
  async runAutomatedTests(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/integrations/github/run-tests', {});
  },
  /** List automated tests seeded for this org's GitHub integration */
  async getAutomatedTests(): Promise<{ success: boolean; data: AutomatedTestResult[]; seeded: boolean }> {
    return apiClient.get('/integrations/github/tests');
  },
  getConnectUrl(): string {
    const backendUrl = (import.meta as any).env?.VITE_API_URL ?? 'https://ismsbackend.bitcoingames1346.com';
    const token = localStorage.getItem('isms_token') ?? '';
    return `${backendUrl}/integrations/github/connect?token=${encodeURIComponent(token)}`;
  },
  getDriveConnectUrl(): string {
    const backendUrl = (import.meta as any).env?.VITE_API_URL ?? 'https://ismsbackend.bitcoingames1346.com';
    const token = localStorage.getItem('isms_token') ?? '';
    return `${backendUrl}/integrations/google/connect?token=${encodeURIComponent(token)}`;
  },
  async disconnectDrive(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/google');
  },
};
