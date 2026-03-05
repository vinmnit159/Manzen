import { apiClient } from './client';

export interface EngineerAIntegrationRecord {
  id: string;
  organizationId: string;
  provider: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

type ListResponse = { success: boolean; data: EngineerAIntegrationRecord[] };
type ConnectResponse = { success: boolean; data: EngineerAIntegrationRecord };

export function createEngineerAService(basePath: string) {
  return {
    getAccounts: () => apiClient.get<ListResponse>(`${basePath}/accounts`),
    connect: (payload: { apiKey: string; accountId?: string; tenant?: string; baseUrl?: string; region?: string; label?: string }) =>
      apiClient.post<ConnectResponse>(`${basePath}/connect`, payload),
    disconnect: (integrationId: string) => apiClient.delete<{ success: boolean }>(`${basePath}/${integrationId}`),
    runScan: (integrationId: string) => apiClient.post<{ success: boolean; jobId: string; status: string }>(`${basePath}/${integrationId}/scan`, {}),
    getFindings: (integrationId: string) => apiClient.get<{ success: boolean; data: any[] }>(`${basePath}/${integrationId}/findings`),
    getLogs: (integrationId: string) => apiClient.get<{ success: boolean; data: any[] }>(`${basePath}/${integrationId}/logs`),
    getTests: (integrationId: string) => apiClient.get<{ success: boolean; data: any[] }>(`${basePath}/${integrationId}/tests`),
  };
}
