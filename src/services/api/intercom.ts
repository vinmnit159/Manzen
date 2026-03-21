/* eslint-disable @typescript-eslint/no-explicit-any -- legacy: to be typed progressively */
import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IntercomIntegrationRecord {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
  ticketCount: number;
  openConversations: number;
}

export interface IntercomTicketLink {
  id: string;
  intercomIntegrationId: string;
  sourceEntityType: string;
  sourceEntityId: string;
  intercomConversationId: string;
  intercomConversationUrl: string | null;
  status: string;
  openedAt: string | null;
  firstRespondedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntercomSyncLog {
  id: string;
  intercomIntegrationId: string;
  status: string;
  conversationsChecked: number;
  message: string | null;
  createdAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const intercomService = {
  /** Returns the OAuth redirect URL — navigate to it to start the OAuth flow */
  getConnectUrl(): string {
    return `${apiClient.baseURL}/api/integrations/intercom/auth`;
  },

  /** List connected Intercom integrations for the org */
  async getAccounts(): Promise<{ success: boolean; data: IntercomIntegrationRecord[] }> {
    return apiClient.get('/api/integrations/intercom/accounts');
  },

  /** Disconnect an Intercom integration */
  async disconnect(integrationId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/integrations/intercom/${integrationId}`);
  },

  /** Trigger a manual compliance scan (fire-and-forget) */
  async runScan(integrationId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/api/integrations/intercom/${integrationId}/scan`, {});
  },

  /** Sync open conversation statuses */
  async sync(integrationId: string): Promise<{ success: boolean; synced: number }> {
    return apiClient.post(`/api/integrations/intercom/${integrationId}/sync`, {});
  },

  /** List ticket links for an integration */
  async getTicketLinks(
    integrationId: string,
    params?: { entityType?: string; entityId?: string },
  ): Promise<{ success: boolean; data: IntercomTicketLink[] }> {
    const qs = params
      ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null) as [string, string][])).toString()
      : '';
    return apiClient.get(`/api/integrations/intercom/${integrationId}/ticket-links${qs}`);
  },

  /** Create a ticket link (creates conversation in Intercom) */
  async createTicketLink(
    integrationId: string,
    data: {
      sourceEntityType: 'TRUST_REQUEST' | 'FINDING' | 'TEST';
      sourceEntityId: string;
      subject: string;
      body: string;
      assigneeEmail?: string;
    },
  ): Promise<{ success: boolean; data: IntercomTicketLink }> {
    return apiClient.post(`/api/integrations/intercom/${integrationId}/ticket-links`, data);
  },

  /** Update a ticket link status */
  async updateTicketLink(
    integrationId: string,
    linkId: string,
    data: { status?: string },
  ): Promise<{ success: boolean; data: IntercomTicketLink }> {
    return apiClient.patch(`/api/integrations/intercom/${integrationId}/ticket-links/${linkId}`, data);
  },

  /** Get sync logs */
  async getLogs(integrationId: string): Promise<{ success: boolean; data: IntercomSyncLog[] }> {
    return apiClient.get(`/api/integrations/intercom/${integrationId}/logs`);
  },

  /** List automated tests linked to this integration */
  async getTests(integrationId: string): Promise<{ success: boolean; data: any[]; seeded: boolean }> {
    return apiClient.get(`/api/integrations/intercom/${integrationId}/tests`);
  },

  /** Look up ticket links for any entity (trust request, finding, etc.) */
  async getTicketLinksByEntity(
    entityType: string,
    entityId: string,
  ): Promise<{ success: boolean; data: IntercomTicketLink[] }> {
    return apiClient.get(
      `/api/integrations/intercom/ticket-links/by-entity?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
    );
  },
};
