import { apiClient } from './client';

// ── Enums / unions ────────────────────────────────────────────────────────────

export type TrustDocumentCategory = 'POLICY' | 'REPORT' | 'CERTIFICATE' | 'WHITEPAPER' | 'OTHER';
export type TrustAccessStatus     = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TrustAnnouncementType = 'SECURITY_UPDATE' | 'INCIDENT' | 'CERTIFICATION' | 'GENERAL';

// ── Interface shapes ──────────────────────────────────────────────────────────

export interface TrustCenterSettings {
  id:            string;
  organizationId:string;
  enabled:       boolean;
  orgSlug:       string;
  logoUrl:       string | null;
  primaryColor:  string;
  description:   string | null;
  securityEmail: string | null;
  updatedAt:     string;
  createdAt:     string;
}

export interface TrustComplianceSnapshot {
  total:       number;
  implemented: number;
  partial:     number;
  pct:         number;
  openRisks:   number;
  lastAudit:   { name: string; closedAt: string } | null;
}

export interface TrustSettingsResponse {
  settings: TrustCenterSettings;
  snapshot: TrustComplianceSnapshot;
}

export interface TrustDocument {
  id:            string;
  organizationId:string;
  name:          string;
  category:      TrustDocumentCategory;
  fileUrl:       string;
  requiresNda:   boolean;
  publicVisible: boolean;
  version:       string | null;
  uploadedBy:    string;
  createdAt:     string;
  updatedAt:     string;
}

export interface TrustAccessRequest {
  id:             string;
  organizationId: string;
  requesterName:  string;
  requesterEmail: string;
  company:        string | null;
  purpose:        string | null;
  documentId:     string | null;
  status:         TrustAccessStatus;
  ndaSigned:      boolean;
  approvalToken:  string | null;
  approvedBy:     string | null;
  createdAt:      string;
  approvedAt:     string | null;
  expiresAt:      string | null;
  document:       { id: string; name: string; category: TrustDocumentCategory } | null;
}

export interface TrustAnnouncement {
  id:             string;
  organizationId: string;
  title:          string;
  content:        string;
  type:           TrustAnnouncementType;
  published:      boolean;
  createdAt:      string;
  updatedAt:      string;
}

export interface TrustMetricsSnapshot {
  id:                   string;
  organizationId:       string;
  frameworkName:        string;
  compliancePercentage: number;
  controlCount:         number;
  completedControls:    number;
  snapshotDate:         string;
}

export interface TrustQuestionnaireRequest {
  id:                string;
  organizationId:    string;
  requesterEmail:    string;
  questionnaireType: string;
  status:            string;
  responseFileUrl:   string | null;
  notes:             string | null;
  createdAt:         string;
  respondedAt:       string | null;
}

// Public portal shapes
export interface PublicTrustDocument {
  id:          string;
  name:        string;
  category:    TrustDocumentCategory;
  requiresNda: boolean;
  version:     string | null;
  fileUrl:     string;
}

export interface PublicTrustData {
  settings: {
    orgSlug:       string;
    logoUrl:       string | null;
    primaryColor:  string;
    description:   string | null;
    securityEmail: string | null;
    orgName:       string;
  };
  documents:       PublicTrustDocument[];
  announcements:   { id: string; title: string; content: string; type: TrustAnnouncementType; createdAt: string }[];
  metricsSnapshot: TrustMetricsSnapshot | null;
  lastAudit:       { name: string; type: string; closedAt: string } | null;
}

// Create/update payloads
export interface UpdateSettingsPayload {
  enabled?:       boolean;
  orgSlug?:       string;
  logoUrl?:       string | null;
  primaryColor?:  string;
  description?:   string | null;
  securityEmail?: string | null;
}

export interface CreateDocumentPayload {
  name:          string;
  category:      TrustDocumentCategory;
  fileUrl:       string;
  requiresNda?:  boolean;
  publicVisible?:boolean;
  version?:      string | null;
}

export interface CreateAnnouncementPayload {
  title:      string;
  content:    string;
  type?:      TrustAnnouncementType;
  published?: boolean;
}

export interface PublicAccessRequestPayload {
  requesterName:  string;
  requesterEmail: string;
  company?:       string;
  purpose?:       string;
  documentId?:    string;
  ndaSigned?:     boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

export const trustCenterService = {
  // Settings
  getSettings(): Promise<{ success: boolean; data: TrustSettingsResponse }> {
    return apiClient.get('/api/trust/settings');
  },
  updateSettings(payload: UpdateSettingsPayload): Promise<{ success: boolean; data: TrustCenterSettings }> {
    return apiClient.put('/api/trust/settings', payload);
  },

  // Documents
  listDocuments(): Promise<{ success: boolean; data: TrustDocument[] }> {
    return apiClient.get('/api/trust/documents');
  },
  createDocument(payload: CreateDocumentPayload): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.post('/api/trust/documents', payload);
  },
  updateDocument(id: string, payload: Partial<CreateDocumentPayload>): Promise<{ success: boolean; data: TrustDocument }> {
    return apiClient.patch(`/api/trust/documents/${id}`, payload);
  },
  deleteDocument(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/trust/documents/${id}`);
  },

  // Access Requests
  listAccessRequests(): Promise<{ success: boolean; data: TrustAccessRequest[] }> {
    return apiClient.get('/api/trust/access-requests');
  },
  decideAccessRequest(id: string, status: 'APPROVED' | 'REJECTED'): Promise<{ success: boolean; data: TrustAccessRequest }> {
    return apiClient.patch(`/api/trust/access-requests/${id}`, { status });
  },

  // Announcements
  listAnnouncements(): Promise<{ success: boolean; data: TrustAnnouncement[] }> {
    return apiClient.get('/api/trust/announcements');
  },
  createAnnouncement(payload: CreateAnnouncementPayload): Promise<{ success: boolean; data: TrustAnnouncement }> {
    return apiClient.post('/api/trust/announcements', payload);
  },
  updateAnnouncement(id: string, payload: Partial<CreateAnnouncementPayload>): Promise<{ success: boolean; data: TrustAnnouncement }> {
    return apiClient.patch(`/api/trust/announcements/${id}`, payload);
  },
  deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/trust/announcements/${id}`);
  },

  // Questionnaire Requests
  listQuestionnaireRequests(): Promise<{ success: boolean; data: TrustQuestionnaireRequest[] }> {
    return apiClient.get('/api/trust/questionnaire-requests');
  },
  updateQuestionnaireRequest(id: string, payload: { status?: string; responseFileUrl?: string | null; notes?: string | null }): Promise<{ success: boolean; data: TrustQuestionnaireRequest }> {
    return apiClient.patch(`/api/trust/questionnaire-requests/${id}`, payload);
  },

  // Metrics Snapshot
  triggerSnapshot(): Promise<{ success: boolean; data: TrustMetricsSnapshot }> {
    return apiClient.post('/api/trust/metrics/snapshot');
  },

  // Public (no auth)
  getPublicPortal(orgSlug: string): Promise<{ success: boolean; data: PublicTrustData }> {
    return apiClient.get(`/api/trust/public/${orgSlug}`);
  },
  submitAccessRequest(orgSlug: string, payload: PublicAccessRequestPayload): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/trust/public/${orgSlug}/request-access`, payload);
  },
  submitQuestionnaireRequest(orgSlug: string, payload: { requesterEmail: string; questionnaireType?: string }): Promise<{ success: boolean; data: { id: string } }> {
    return apiClient.post(`/api/trust/public/${orgSlug}/request-questionnaire`, payload);
  },
};
