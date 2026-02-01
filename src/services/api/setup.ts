import { apiClient, ApiResponse } from './client';

export interface SetupRequest {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  orgAdminName: string;
  orgAdminEmail: string;
  orgAdminPassword: string;
}

export interface SetupResponse {
  organization: {
    id: string;
    name: string;
    createdAt: string;
  };
  superAdmin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  orgAdmin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  setupComplete: boolean;
}

export interface SetupStatusResponse {
  setup: boolean;
  userCount: number;
  organizationCount: number;
  canSetup: boolean;
}

export class SetupService {
  // Setup the system
  async setup(data: SetupRequest): Promise<ApiResponse<SetupResponse>> {
    return apiClient.post('/api/setup/setup', data);
  }

  // Check setup status
  async getSetupStatus(): Promise<ApiResponse<SetupStatusResponse>> {
    return apiClient.get('/api/setup/setup-status');
  }

  // Reset system (development only)
  async resetSystem(): Promise<ApiResponse<any>> {
    return apiClient.post('/api/setup/reset-system');
  }
}

export const setupService = new SetupService();