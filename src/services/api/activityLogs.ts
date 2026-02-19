import { apiClient, ApiResponse } from './client';

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string;
  /** Human-readable sentence, e.g. "Risk created: \"SQL Injection in API\"" */
  label: string;
  /** 'success' | 'warning' | 'info' — used for dot colour in the feed */
  status: 'success' | 'warning' | 'info';
  /** Relative time string, e.g. "3 minutes ago" */
  timeAgo: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
}

class ActivityLogsService {
  async getRecentActivity(limit = 10): Promise<ApiResponse<ActivityLogEntry[]>> {
    return apiClient.get('/api/activity-logs', { limit: String(limit) });
  }
}

export const activityLogsService = new ActivityLogsService();
