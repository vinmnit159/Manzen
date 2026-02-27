import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AwsAccountRecord {
  id: string;
  awsAccountId: string;
  label: string | null;
  region: string;
  status: string;
  lastScanAt: string | null;
  createdAt: string;
}

export interface AwsTrustPolicyData {
  externalId: string;
  ismsAccountId: string;
  trustPolicyJson: string;
  permissionPolicyJson: string;
}

export interface AwsFinding {
  id: string;
  awsAccountId: string;
  findingKey: string;
  severity: string;
  controlMapped: string | null;
  title: string;
  description: string;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const awsService = {
  /** Generate a fresh External ID + return trust/permission policy JSON */
  async getTrustPolicy(): Promise<{ success: boolean; data: AwsTrustPolicyData }> {
    return apiClient.get('/integrations/aws/trust-policy');
  },

  /** Connect an AWS account via cross-account IAM role */
  async connect(data: {
    roleArn: string;
    awsAccountId: string;
    externalId: string;
    region?: string;
    label?: string;
  }): Promise<{ success: boolean; data: AwsAccountRecord }> {
    return apiClient.post('/integrations/aws/connect', data);
  },

  /** List connected AWS accounts for the org */
  async getAccounts(): Promise<{ success: boolean; data: AwsAccountRecord[] }> {
    return apiClient.get('/integrations/aws/accounts');
  },

  /** Disconnect an AWS account */
  async disconnect(accountId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/integrations/aws/${accountId}`);
  },

  /** Trigger a manual scan (fire-and-forget on backend) */
  async runScan(accountId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/integrations/aws/${accountId}/scan`, {});
  },

  /** Get findings for an AWS account */
  async getFindings(accountId: string): Promise<{ success: boolean; data: AwsFinding[] }> {
    return apiClient.get(`/integrations/aws/${accountId}/findings`);
  },

  /** List automated tests linked to an AWS account */
  async getTests(accountId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/integrations/aws/${accountId}/tests`);
  },
};
