/**
 * remediation.ts — API client for the Remediation Engine (RE-1/RE-2).
 *
 * Covers:
 *   - TenantPolicy CRUD (org-level remediation guardrails)
 *   - RemediationAction listing per finding
 *   - Dry run, request approval, approve, reject, execute, rollback
 *   - Execution history retrieval
 */

import { apiClient } from './client';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RemediationActionStatus =
  | 'PENDING'
  | 'DRY_RUN_READY'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'ROLLED_BACK'
  | 'CANCELLED';

export interface RemediationExecution {
  id: string;
  mode: 'DRY_RUN' | 'EXECUTE' | 'VERIFY' | 'ROLLBACK';
  status: 'STARTED' | 'SUCCEEDED' | 'FAILED';
  diffJson: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  } | null;
  riskSummary: string | null;
  warningsJson: string[] | null;
  executedBy: string;
  startedAt: string;
  finishedAt: string | null;
}

export interface RemediationApproval {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  approvalSource: 'SLACK' | 'JIRA' | 'UI' | 'SYSTEM';
  approverUserId: string | null;
  comment: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RemediationAction {
  id: string;
  organizationId: string;
  findingId: string;
  provider: string;
  resourceType: string;
  resourceId: string;
  actionType: string;
  status: RemediationActionStatus;
  riskLevel: string;
  requiresApproval: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
  executedBy: string | null;
  executedAt: string | null;
  lastError: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
  latestExecution: RemediationExecution | null;
  latestApproval: RemediationApproval | null;
}

export interface TenantPolicy {
  id: string;
  organizationId: string;
  autoFixEnabled: boolean;
  maxAutoFixSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  allowProductionCriticalAutoFix: boolean;
  requireApprovalForProduction: boolean;
  defaultApprovalChannel: 'slack' | 'jira' | 'manual' | null;
}

export interface UpdateTenantPolicyRequest {
  autoFixEnabled?: boolean;
  maxAutoFixSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  allowProductionCriticalAutoFix?: boolean;
  requireApprovalForProduction?: boolean;
  defaultApprovalChannel?: 'slack' | 'jira' | 'manual' | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const remediationService = {
  // ── TenantPolicy ────────────────────────────────────────────────────────────

  async getPolicy(): Promise<TenantPolicy | null> {
    const res = await apiClient.get<{ policy: TenantPolicy | null }>(
      '/api/remediation/policy',
    );
    return res.policy ?? null;
  },

  async updatePolicy(data: UpdateTenantPolicyRequest): Promise<TenantPolicy> {
    const res = await apiClient.put<{ policy: TenantPolicy }>(
      '/api/remediation/policy',
      data,
    );
    return res.policy;
  },

  // ── Actions per finding ──────────────────────────────────────────────────────

  async listActions(findingId: string): Promise<RemediationAction[]> {
    const res = await apiClient.get<{ actions: RemediationAction[] }>(
      `/api/remediation/findings/${findingId}/remediation-actions`,
    );
    return res.actions;
  },

  async getHistory(
    findingId: string,
    remediationActionId: string,
  ): Promise<RemediationExecution[]> {
    const res = await apiClient.get<{ history: RemediationExecution[] }>(
      `/api/remediation/findings/${findingId}/remediation/${remediationActionId}/history`,
    );
    return res.history;
  },

  // ── Workflow actions ─────────────────────────────────────────────────────────

  async requestDryRun(
    findingId: string,
    remediationActionId: string,
  ): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/dry-run`,
      {
        remediationActionId,
      },
    );
  },

  async requestApproval(
    findingId: string,
    remediationActionId: string,
  ): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/request-approval`,
      { remediationActionId },
    );
  },

  async approve(
    findingId: string,
    remediationActionId: string,
    comment?: string,
  ): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/approve`,
      {
        remediationActionId,
        comment,
      },
    );
  },

  async reject(
    findingId: string,
    remediationActionId: string,
    comment?: string,
  ): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/reject`,
      {
        remediationActionId,
        comment,
      },
    );
  },

  async execute(findingId: string, remediationActionId: string): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/execute`,
      {
        remediationActionId,
      },
    );
  },

  async rollback(
    findingId: string,
    remediationActionId: string,
  ): Promise<void> {
    await apiClient.post(
      `/api/remediation/findings/${findingId}/remediation/rollback`,
      {
        remediationActionId,
      },
    );
  },
};
