import { apiClient } from './client';

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

export interface Integration {
  id: string;
  provider: string;
  status: 'ACTIVE' | 'DISCONNECTED';
  createdAt: string;
  updatedAt: string;
  repos: GitHubRepo[];
}

export const integrationsService = {
  async getStatus(): Promise<{ integrations: Integration[] }> {
    return apiClient.get('/integrations/status');
  },

  // ── GitHub ────────────────────────────────────────────────────────────────

  async getGitHubRepos(): Promise<{ repos: GitHubRepo[] }> {
    return apiClient.get('/integrations/github/repos');
  },

  async triggerScan(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/integrations/github/scan', {});
  },

  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/github');
  },

  getConnectUrl(): string {
    const backendUrl = (import.meta as any).env?.VITE_API_URL ?? 'https://ismsbackend.bitcoingames1346.com';
    const token = localStorage.getItem('isms_token') ?? '';
    return `${backendUrl}/integrations/github/connect?token=${encodeURIComponent(token)}`;
  },

  // ── Google Drive ──────────────────────────────────────────────────────────

  getDriveConnectUrl(): string {
    const backendUrl = (import.meta as any).env?.VITE_API_URL ?? 'https://ismsbackend.bitcoingames1346.com';
    const token = localStorage.getItem('isms_token') ?? '';
    return `${backendUrl}/integrations/google/connect?token=${encodeURIComponent(token)}`;
  },

  async disconnectDrive(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/google');
  },
};
