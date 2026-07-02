export function parseApiError(
  body: string,
  fallback = 'Request failed',
): string {
  const trimmed = body.trim();
  if (!trimmed) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string | string[];
      error?: string;
    };

    if (Array.isArray(parsed.message)) {
      return parsed.message.join(', ');
    }

    if (typeof parsed.message === 'string' && parsed.message.trim()) {
      return parsed.message;
    }

    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // plain-text response
  }

  return trimmed;
}
