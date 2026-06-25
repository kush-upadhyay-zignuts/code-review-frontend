export function parseApiError(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (typeof json.message === 'string') return json.message;
    if (Array.isArray(json.message)) return json.message.join(', ');
  } catch {
    if (text) return text;
  }
  return fallback;
}
