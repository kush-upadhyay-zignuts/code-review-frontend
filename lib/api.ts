import { useAuthStore } from './auth-store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Opens the review SSE stream directly against the backend (required in production). */
export async function openReviewStream(
  code: string,
  options: { language?: string; signal?: AbortSignal } = {},
): Promise<Response> {
  if (!API_BASE) {
    throw new Error('NEXT_PUBLIC_API_BASE_URL is not configured.');
  }

  const token = useAuthStore.getState().accessToken;
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/reviews/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      code,
      ...(options.language ? { language: options.language } : {}),
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Review failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Review stream returned no data.');
  }

  return response;
}

export { API_BASE };
