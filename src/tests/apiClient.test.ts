import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiError } from '@/services/api/client';

describe('apiClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    sessionStorage.clear();
    localStorage.clear();
    apiClient.removeToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns undefined for empty success responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    );

    await expect(apiClient.delete('/api/example')).resolves.toBeUndefined();
  });

  it('preserves text error payloads for non-JSON responses', async () => {
    fetchMock.mockResolvedValue(
      new Response('plain text failure', {
        status: 502,
        statusText: 'Bad Gateway',
        headers: { 'content-type': 'text/plain' },
      }),
    );

    await expect(apiClient.get('/api/example')).rejects.toMatchObject({
      error: 'Bad Gateway',
      message: 'plain text failure',
      statusCode: 502,
    } satisfies Partial<ApiError>);
  });

  it('clears the auth session after a 401 response', async () => {
    sessionStorage.setItem('isms_token', 'token-123');
    sessionStorage.setItem('isms_user', JSON.stringify({ id: 'user-1' }));
    apiClient.token = 'token-123';

    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Unauthorized', message: 'Expired token' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(apiClient.get('/api/example')).rejects.toMatchObject({
      statusCode: 401,
    } satisfies Partial<ApiError>);
    expect(sessionStorage.getItem('isms_token')).toBeNull();
    expect(sessionStorage.getItem('isms_user')).toBeNull();
  });
});
