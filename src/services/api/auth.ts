import { apiClient, ApiResponse } from './client';
import {
  clearAuthSession,
  getAuthToken,
  getCachedUser as getStoredUser,
  hasAuthToken,
  setAuthToken,
  setCachedUser as storeCachedUser,
  clearCachedUser as clearStoredUser,
} from '@/services/authStorage';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  CurrentUser,
  User 
} from './types';

export class AuthService {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/api/auth/login', credentials);
  }

  // Register new user
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/api/auth/register', userData);
  }

  // Get current user
  async getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
    return apiClient.get('/api/auth/me');
  }

  // Logout (client-side only - remove token)
  logout(): void {
    apiClient.removeToken();
    clearAuthSession();
  }

  // Store auth token
  setToken(token: string): void {
    setAuthToken(token);
    apiClient.setToken(token);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return hasAuthToken();
  }

  // Get stored token
  getToken(): string | null {
    return getAuthToken();
  }

  // Get current user from localStorage (cached)
  getCachedUser(): User | null {
    return getStoredUser<User>();
  }

  // Cache current user data
  cacheUser(user: User): void {
    storeCachedUser(user);
  }

  // Clear cached user data
  clearCachedUser(): void {
    clearStoredUser();
  }
}

export const authService = new AuthService();
