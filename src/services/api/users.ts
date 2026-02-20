import { apiClient } from './client';
import { User, Role } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserGitAccount {
  id: string;
  githubUsername: string;
  githubId: number | null;
  avatarUrl: string | null;
  profileUrl: string | null;
}

export interface UserWithGit extends User {
  gitAccounts: UserGitAccount[];
}

export interface GitHubMember {
  githubId: number;
  githubUsername: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  /** The ISMS user id this GitHub account is currently mapped to, or null */
  mappedUserId: string | null;
}

export interface LinkedGitAccount extends UserGitAccount {
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const usersService = {
  /** List all users in the organisation */
  async listUsers(): Promise<{ users: UserWithGit[] }> {
    return apiClient.get('/api/users');
  },

  /** Get a single user by id */
  async getUser(id: string): Promise<{ user: UserWithGit }> {
    return apiClient.get(`/api/users/${id}`);
  },

  /** Update a user's role and/or display name (admin only) */
  async updateUser(id: string, data: { role?: Role; name?: string }): Promise<{ user: UserWithGit }> {
    return apiClient.put(`/api/users/${id}`, data);
  },

  /** Remove a user from the organisation (admin only) */
  async deleteUser(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/users/${id}`);
  },

  // ── Git account mapping ──────────────────────────────────────────────────

  /** List all GitHub accounts linked to ISMS users in this org */
  async listGitAccounts(): Promise<{ accounts: LinkedGitAccount[] }> {
    return apiClient.get('/api/users/git-accounts/list');
  },

  /**
   * Fetch GitHub organisation members via the backend (requires an active
   * GitHub integration). Each member includes `mappedUserId` showing which
   * ISMS user they are currently linked to.
   */
  async getGitHubMembers(): Promise<{ members: GitHubMember[]; connected: boolean }> {
    return apiClient.get('/api/users/git-accounts/github-members');
  },

  /** Link a GitHub account to an ISMS user */
  async mapGitAccount(data: {
    userId: string;
    githubUsername: string;
    githubId?: number;
    avatarUrl?: string;
    profileUrl?: string;
  }): Promise<{ account: LinkedGitAccount }> {
    return apiClient.post('/api/users/git-accounts/map', data);
  },

  /** Remove a GitHub ↔ ISMS user link */
  async unmapGitAccount(id: string): Promise<{ success: boolean }> {
    return apiClient.delete(`/api/users/git-accounts/${id}`);
  },
};
