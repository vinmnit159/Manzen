import { apiClient, ApiResponse } from './client';
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
  }

  // Store auth token
  setToken(token: string): void {
    apiClient.setToken(token);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('isms_token');
  }

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('isms_token');
  }

  // Get current user from localStorage (cached)
  getCachedUser(): User | null {
    const userData = localStorage.getItem('isms_user');
    return userData ? JSON.parse(userData) : null;
  }

  // Cache current user data
  cacheUser(user: User): void {
    localStorage.setItem('isms_user', JSON.stringify(user));
  }

  // Clear cached user data
  clearCachedUser(): void {
    localStorage.removeItem('isms_user');
  }
}

export const authService = new AuthService();