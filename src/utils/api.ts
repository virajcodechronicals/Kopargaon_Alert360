/**
 * Resilient API client for Kopargaon Alert360
 * Handles non-JSON responses, HTML 404/500 pages, and network failures gracefully.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const rawText = await res.text();
    let data: any = null;

    const contentType = res.headers.get('content-type') || '';
    const trimmed = rawText.trim();

    if (
      contentType.includes('application/json') ||
      trimmed.startsWith('{') ||
      trimmed.startsWith('[')
    ) {
      try {
        data = JSON.parse(rawText);
      } catch (parseError) {
        console.error(`Failed to parse JSON response from ${url}:`, rawText);
        return {
          ok: false,
          status: res.status,
          error: 'Unable to parse server response. Please try again.',
        };
      }
    } else {
      // Server returned HTML (e.g., Vercel 404 page or static fallback)
      console.warn(`Non-JSON response received from ${url} (status ${res.status}):`, rawText.slice(0, 150));
      return {
        ok: false,
        status: res.status,
        error: res.status === 404
          ? 'API route not found. Check server configuration.'
          : 'Unexpected server response format. Please try again.',
      };
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: data?.error || data?.message || `Request failed with status ${res.status}`,
      };
    }

    return { ok: true, status: res.status, data };
  } catch (networkError: any) {
    console.error(`Network error when calling ${url}:`, networkError);
    return {
      ok: false,
      status: 0,
      error: 'Network connectivity error. Please check your internet connection.',
    };
  }
}
