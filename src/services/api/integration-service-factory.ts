/* eslint-disable @typescript-eslint/no-explicit-any -- factory returns generic shapes */
import { apiClient } from './client';

// ─── Shared response wrappers ────────────────────────────────────────────────

export interface IntegrationListResponse<TAccount> {
  success: boolean;
  data: TAccount[];
}

export interface IntegrationSingleResponse<TAccount> {
  success: boolean;
  data: TAccount;
}

export interface IntegrationActionResponse {
  success: boolean;
  message?: string;
}

export interface IntegrationFindingsResponse<TFinding> {
  success: boolean;
  data: TFinding[];
}

export interface IntegrationLogsResponse<TLog> {
  success: boolean;
  data: TLog[];
}

export interface IntegrationTestsResponse {
  success: boolean;
  data: any[];
  seeded: boolean;
}

// ─── Standard integration service shape ──────────────────────────────────────

export interface IntegrationService<TAccount, TFinding, TLog> {
  getAccounts(): Promise<IntegrationListResponse<TAccount>>;
  connect(data: Record<string, unknown>): Promise<IntegrationSingleResponse<TAccount>>;
  disconnect(id: string): Promise<{ success: boolean }>;
  runScan(id: string): Promise<IntegrationActionResponse>;
  getFindings(id: string): Promise<IntegrationFindingsResponse<TFinding>>;
  getLogs(id: string): Promise<IntegrationLogsResponse<TLog>>;
  getTests(id: string): Promise<IntegrationTestsResponse>;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Creates a standard integration service with the common CRUD + scan pattern.
 *
 * @param providerSlug  URL segment, e.g. 'okta', 'snyk', 'pagerduty'
 * @param overrides     Optional method overrides or extra methods to merge in
 *
 * Usage:
 *   export const oktaService = createIntegrationService<OktaRecord, FindingRecord, LogRecord>('okta');
 *   export const bamboohrService = createIntegrationService<HRRecord, never, never>('bamboohr', {
 *     syncEmployees(id: string) { return apiClient.post(`/api/integrations/bamboohr/${id}/sync`, {}); },
 *   });
 */
/* Overload: no overrides → clean IntegrationService type */
export function createIntegrationService<
  TAccount = any,
  TFinding = any,
  TLog = any,
>(providerSlug: string): IntegrationService<TAccount, TFinding, TLog>;

/* Overload: with overrides → merged type */
export function createIntegrationService<
  TAccount = any,
  TFinding = any,
  TLog = any,
  TOverrides extends Record<string, (...args: any[]) => any> = Record<string, (...args: any[]) => any>,
>(providerSlug: string, overrides: TOverrides): IntegrationService<TAccount, TFinding, TLog> & TOverrides;

/* Implementation */
export function createIntegrationService<
  TAccount = any,
  TFinding = any,
  TLog = any,
>(
  providerSlug: string,
  overrides?: Record<string, (...args: any[]) => any>,
): IntegrationService<TAccount, TFinding, TLog> & Record<string, (...args: any[]) => any> {
  const basePath = `/api/integrations/${providerSlug}`;

  const service: IntegrationService<TAccount, TFinding, TLog> = {
    async getAccounts() {
      return apiClient.get(`${basePath}/accounts`);
    },
    async connect(data) {
      return apiClient.post(`${basePath}/connect`, data);
    },
    async disconnect(id) {
      return apiClient.delete(`${basePath}/${id}`);
    },
    async runScan(id) {
      return apiClient.post(`${basePath}/${id}/scan`, {});
    },
    async getFindings(id) {
      return apiClient.get(`${basePath}/${id}/findings`);
    },
    async getLogs(id) {
      return apiClient.get(`${basePath}/${id}/logs`);
    },
    async getTests(id) {
      return apiClient.get(`${basePath}/${id}/tests`);
    },
  };

  return { ...service, ...overrides } as IntegrationService<TAccount, TFinding, TLog> &
    Record<string, (...args: any[]) => any>;
}
