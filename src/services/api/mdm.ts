import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeviceCompliance {
  id: string;
  assetId: string;
  diskEncryptionEnabled: boolean;
  screenLockEnabled: boolean;
  firewallEnabled: boolean;
  antivirusEnabled: boolean;
  systemIntegrityEnabled: boolean;
  autoUpdateEnabled: boolean;
  gatekeeperEnabled: boolean;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'UNKNOWN';
  lastCheckedAt: string;
}

export interface DeviceEnrollmentInfo {
  id: string;
  enrolledAt: string;
  lastSeenAt: string;
  revoked: boolean;
}

export interface ManagedDevice {
  id: string;
  name: string;
  hostname: string | null;
  osType: string | null;
  osVersion: string | null;
  serialNumber: string | null;
  status: string;
  createdAt: string;
  ownerId: string | null;
  compliance: DeviceCompliance | null;
  enrollment: DeviceEnrollmentInfo | null;
}

export interface EnrollmentToken {
  id: string;
  label: string | null;
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
}

export interface CreatedToken extends EnrollmentToken {
  token: string;
  installCommand: string;
}

export interface MdmOverview {
  total: number;
  compliant: number;
  nonCompliant: number;
  unknown: number;
}

export interface DeviceCheckin {
  id: string;
  assetId: string;
  payloadJson: any;
  receivedAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const mdmService = {
  // ── Tokens ────────────────────────────────────────────────────────────────

  async createToken(label?: string): Promise<CreatedToken> {
    return apiClient.post('/api/mdm/tokens', { label });
  },

  async listTokens(): Promise<{ tokens: EnrollmentToken[] }> {
    return apiClient.get('/api/mdm/tokens');
  },

  async deleteToken(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/mdm/tokens/${id}`);
  },

  // ── Devices ───────────────────────────────────────────────────────────────

  async listDevices(): Promise<{ devices: ManagedDevice[] }> {
    return apiClient.get('/api/mdm/devices');
  },

  async getDeviceCheckins(
    deviceId: string,
    limit = 20
  ): Promise<{ checkins: DeviceCheckin[] }> {
    return apiClient.get(`/api/mdm/devices/${deviceId}/checkins`, { limit: String(limit) });
  },

  async revokeDevice(deviceId: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/mdm/devices/${deviceId}`);
  },

  async reassignOwner(deviceId: string, ownerId: string): Promise<{ device: ManagedDevice; newOwner: { id: string; name: string; email: string } }> {
    return apiClient.patch(`/api/mdm/devices/${deviceId}/owner`, { ownerId });
  },

  // ── Overview ──────────────────────────────────────────────────────────────

  async getOverview(): Promise<MdmOverview> {
    return apiClient.get('/api/mdm/overview');
  },
};
