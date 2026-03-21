import { apiClient } from './client';

// ── Types ────────────────────────────────────────────────────────────────────

export interface McpSettings {
  organizationId: string;
  enabled: boolean;
  allowMutations: boolean;
  allowScans: boolean;
  allowedTools: string[];
}

export interface McpSettingsUpdate {
  enabled?: boolean;
  allowMutations?: boolean;
  allowScans?: boolean;
  allowedTools?: string[];
}

export interface McpApiKey {
  id: string;
  label: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdBy: string;
  createdAt: string;
}

export interface McpApiKeyCreate {
  label: string;
  expiresAt?: string;
}

export interface McpApiKeyCreateResponse extends McpApiKey {
  key: string; // raw key — shown ONCE
}

export interface McpExecutionLog {
  id: string;
  mcpApiKeyId: string;
  correlationId: string;
  toolName: string;
  status: 'SUCCESS' | 'ERROR' | 'VALIDATION_ERROR';
  errorMessage: string | null;
  durationMs: number | null;
  createdAt: string;
  mcpApiKey: { label: string };
}

// ── Service ──────────────────────────────────────────────────────────────────

export const mcpService = {
  // Settings
  async getSettings(): Promise<McpSettings> {
    const res = await apiClient.get<{ success: boolean; data: McpSettings }>(
      '/api/mcp/settings',
    );
    return res.data;
  },

  async updateSettings(data: McpSettingsUpdate): Promise<McpSettings> {
    const res = await apiClient.put<{ success: boolean; data: McpSettings }>(
      '/api/mcp/settings',
      data,
    );
    return res.data;
  },

  // API Keys
  async listKeys(): Promise<McpApiKey[]> {
    const res = await apiClient.get<{ success: boolean; data: McpApiKey[] }>(
      '/api/mcp/keys',
    );
    return res.data;
  },

  async createKey(
    data: McpApiKeyCreate,
  ): Promise<{ data: McpApiKeyCreateResponse; warning: string }> {
    const res = await apiClient.post<{
      success: boolean;
      data: McpApiKeyCreateResponse;
      warning: string;
    }>('/api/mcp/keys', data);
    return { data: res.data, warning: res.warning };
  },

  async revokeKey(id: string): Promise<void> {
    await apiClient.delete(`/mcp/keys/${id}`);
  },

  // Execution logs
  async getLogs(limit = 100): Promise<McpExecutionLog[]> {
    const res = await apiClient.get<{
      success: boolean;
      data: McpExecutionLog[];
    }>(`/mcp/logs?limit=${limit}`);
    return res.data;
  },
};
