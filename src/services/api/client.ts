// Base API configuration and types
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.cloudanzen.com';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Error types
export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// HTTP client wrapper
class ApiClient {
  public baseURL: string;
  public token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;

    // SECURITY NOTE: JWT is currently stored in localStorage, which is
    // accessible to JavaScript and therefore vulnerable to XSS attacks.
    //
    // Recommended migration path:
    //   1. Move to httpOnly, Secure, SameSite=Strict cookies set by the backend
    //      on login (prevents JS access entirely).
    //   2. Backend sends Set-Cookie header with the JWT; client sends credentials
    //      with `credentials: 'include'` on every fetch.
    //   3. Remove `setToken`/`removeToken` localStorage helpers; logout becomes
    //      a POST to /api/auth/logout that clears the cookie server-side.
    //
    // This change requires backend coordination (CORS must allow credentials,
    // cookie domain must match) and is tracked in the security backlog.
    this.token = localStorage.getItem('isms_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('isms_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('isms_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || 'Request failed',
          data.message || 'An error occurred',
          response.status,
          data.details
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Network Error',
        'Failed to connect to the server',
        0
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

class ApiError extends Error {
  constructor(
    public error: string,
    public message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
  }
}

export const apiClient = new ApiClient();