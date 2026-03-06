import { apiClient } from './client';

export interface PartnerApiKey {
  id: string;
  name: string;
  toolName: string;
  toolCategory: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
  scopes: string[];
}

export interface IssueKeyResponse {
  success: boolean;
  data: {
    keyId: string;
    name: string;
    toolName: string;
    toolCategory: string;
    rawKey: string;
    expiresAt: string | null;
    createdAt: string;
    warning: string;
  };
}

export interface PartnerScanResult {
  id: string;
  toolName: string;
  toolCategory: string;
  passCount: number;
  warnCount: number;
  failCount: number;
  scannedAt: string;
  partnerKeyId: string;
}

export interface PartnerScanResultDetail extends PartnerScanResult {
  findings: Array<{
    testName: string;
    result: 'pass' | 'warn' | 'fail';
    severity: string;
    detail: string;
    isoControl?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface CatalogueTool {
  provider: string;
  category: string;
  description: string;
  suggestedTests: Array<{
    name: string;
    isoControl: string;
    severity: string;
  }>;
}

export const partnerService = {
  /** Issue a new partner API key */
  issueKey: (payload: {
    name: string;
    toolName: string;
    toolCategory: string;
    expiresAt?: string;
  }) =>
    apiClient.post<IssueKeyResponse>('/api/partner/keys', payload),

  /** List all keys for this org */
  listKeys: () =>
    apiClient.get<{ success: boolean; data: PartnerApiKey[] }>('/api/partner/keys'),

  /** Revoke a key */
  revokeKey: (keyId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/partner/keys/${keyId}`),

  /** List all inbound scan results */
  listResults: (params?: { toolName?: string; limit?: string; offset?: string }) =>
    apiClient.get<{ success: boolean; data: PartnerScanResult[]; total: number }>(
      '/api/partner/results',
      params as Record<string, string> | undefined,
    ),

  /** Full detail of a single scan result */
  getResult: (id: string) =>
    apiClient.get<{ success: boolean; data: PartnerScanResultDetail }>(`/api/partner/results/${id}`),

  /** Integration catalogue */
  getCatalogue: () =>
    apiClient.get<{ success: boolean; count: number; data: CatalogueTool[] }>(
      '/api/partner/integrations',
    ),
};
