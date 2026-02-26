import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlackIntegration {
  id: string;
  workspaceId: string;
  workspaceName: string;
  installedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SlackChannel {
  id: string;
  organizationId: string;
  channelId: string;
  channelName: string;
  eventType: string;
  createdAt: string;
}

export interface SlackEventLog {
  id: string;
  organizationId: string;
  slackUserId: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  messageTs: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export const SLACK_EVENT_TYPES = [
  { value: 'RISK_CRITICAL',    label: 'Critical Risk Created' },
  { value: 'FINDING_CREATED',  label: 'Finding Created' },
  { value: 'FINDING_MAJOR',    label: 'Major Finding Created' },
  { value: 'AUDIT_SCHEDULED',  label: 'Audit Scheduled' },
  { value: 'AUDIT_COMPLETED',  label: 'Audit Completed' },
  { value: 'TEST_OVERDUE',     label: 'Test Overdue' },
] as const;

// ─── Service ──────────────────────────────────────────────────────────────────

export const slackService = {
  /** Get the OAuth install URL (redirects browser directly) */
  getInstallUrl(): string {
    const token = localStorage.getItem('isms_token') ?? '';
    return `${apiClient.baseURL}/api/integrations/slack/install?token=${encodeURIComponent(token)}`;
  },

  /** Get the current Slack integration status for this org */
  async getStatus(): Promise<{ success: boolean; data: SlackIntegration | null }> {
    return apiClient.get('/api/integrations/slack/status');
  },

  /** Disconnect Slack */
  async disconnect(): Promise<{ success: boolean }> {
    return apiClient.delete('/api/integrations/slack/');
  },

  /** List channel → event type mappings */
  async getChannels(): Promise<{ success: boolean; data: SlackChannel[] }> {
    return apiClient.get('/api/integrations/slack/channels');
  },

  /** Add a channel mapping */
  async addChannel(payload: {
    channelId: string;
    channelName: string;
    eventType: string;
  }): Promise<{ success: boolean; data: SlackChannel }> {
    return apiClient.post('/api/integrations/slack/channels', payload);
  },

  /** Remove a channel mapping */
  async removeChannel(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/slack/channels/${id}`);
  },

  /** List event log entries */
  async getEvents(page = 1, limit = 50): Promise<{
    success: boolean;
    data: SlackEventLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    return apiClient.get('/api/integrations/slack/events', {
      page: String(page),
      limit: String(limit),
    });
  },
};
