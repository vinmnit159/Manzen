import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotionStatus {
  id: string;
  workspaceId: string;
  workspaceName: string;
  workspaceIcon: string | null;
  connectedAt: string;
  updatedAt: string;
  linkedDatabases: NotionDatabase[];
  lastSync: { createdAt: string; status: string } | null;
}

export interface NotionDatabase {
  id: string;
  databaseName: string;
  lastSyncedAt: string | null;
}

export interface NotionAvailableDatabase {
  id: string;
  title: string;
  url: string;
  linked: boolean;
}

export interface NotionSyncLog {
  id: string;
  integrationId: string;
  syncType: string;
  status: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  message: string | null;
  tasksFound: number;
  tasksUpdated: number;
  createdAt: string;
}

export interface NotionExternalTask {
  id: string;
  externalTaskId: string;
  title: string;
  status: string;
  ownerUserId: string | null;
  dueDate: string | null;
  mappedTestId: string | null;
  mappedControlId: string | null;
  lastSyncedAt: string;
  notionUrl: string | null;
}

export interface NotionUserMapping {
  id: string;
  organizationId: string;
  ismsUserId: string;
  externalUserId: string;
  externalSource: string;
  email: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const notionService = {
  async getStatus(): Promise<{ connected: boolean; data: NotionStatus | null }> {
    return apiClient.get('/integrations/notion/status');
  },

  async connect(token: string): Promise<{ success: boolean; data: { id: string; workspaceId: string; workspaceName: string; workspaceIcon: string | null } }> {
    return apiClient.post('/integrations/notion/connect', { token });
  },

  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/integrations/notion/');
  },

  async getDatabases(): Promise<{ success: boolean; data: NotionAvailableDatabase[] }> {
    return apiClient.get('/integrations/notion/databases');
  },

  async linkDatabase(databaseId: string, databaseName: string): Promise<{ success: boolean; data: NotionDatabase }> {
    return apiClient.post('/integrations/notion/databases/link', { databaseId, databaseName });
  },

  async unlinkDatabase(mappingId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/notion/databases/${mappingId}`);
  },

  async sync(): Promise<{ success: boolean; message: string }> {
    return apiClient.post('/integrations/notion/sync', {});
  },

  async getTasks(): Promise<{ success: boolean; data: NotionExternalTask[] }> {
    return apiClient.get('/integrations/notion/tasks');
  },

  async getUserMappings(): Promise<{ success: boolean; data: NotionUserMapping[] }> {
    return apiClient.get('/integrations/notion/user-mappings');
  },

  async createUserMapping(data: { ismsUserId: string; externalUserId: string; email?: string }): Promise<{ success: boolean; data: NotionUserMapping }> {
    return apiClient.post('/integrations/notion/user-mappings', data);
  },

  async deleteUserMapping(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/notion/user-mappings/${id}`);
  },

  async createTask(data: {
    testId: string;
    databaseId: string;
    title: string;
    assigneeNotionUserId?: string;
    dueDate?: string;
    controlId?: string;
  }): Promise<{ success: boolean; data: { notionPageId: string; notionPageUrl: string; title: string } }> {
    return apiClient.post('/integrations/notion/create-task', data);
  },

  async getLogs(): Promise<{ success: boolean; data: NotionSyncLog[] }> {
    return apiClient.get('/integrations/notion/logs');
  },

  async getTests(): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get('/integrations/notion/tests');
  },
};
