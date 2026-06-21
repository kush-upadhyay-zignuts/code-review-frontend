import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { randomUUID } from 'crypto';
import { parseSseChunk } from '@/lib/sse-parser';

interface ReviewBody {
  code?: string;
  language?: string;
}

export async function POST(request: Request) {
  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    return Response.json({ message: 'API_BASE_URL is not configured' }, { status: 500 });
  }

  const body = (await request.json()) as ReviewBody;
  const code = body.code?.trim();
  // Language is optional — when absent the AI auto-detects it from the code
  const language = body.language?.trim() || undefined;

  if (!code) {
    return Response.json({ message: 'code is required.' }, { status: 400 });
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return Response.json({ message: 'Authentication required' }, { status: 401 });
  }

  const upstream = await fetch(`${apiBaseUrl}/reviews/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({ code, ...(language ? { language } : {}) }),
  }).catch(() => null);

  if (!upstream) {
    return Response.json(
      { message: 'Backend is unavailable. Make sure the NestJS server is running on port 3001.' },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const textId = randomUUID();
      writer.write({ type: 'start' });
      writer.write({ type: 'text-start', id: textId });

      const reader = upstream.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, remainder } = parseSseChunk(buffer);
          buffer = remainder;

          for (const event of events) {
            switch (event.event) {
              case 'text':
                writer.write({
                  type: 'data-text',
                  data: { content: String(event.data.content ?? '') },
                  transient: true,
                });
                break;
              case 'phase':
                writer.write({ type: 'data-phase', data: event.data });
                break;
              case 'issue':
                writer.write({ type: 'data-issue', data: event.data });
                break;
              case 'issue_partial':
                writer.write({
                  type: 'data-issue-partial',
                  data: event.data,
                  transient: true,
                });
                break;
              case 'summary':
                writer.write({ type: 'data-summary', data: event.data });
                break;
              case 'metrics':
                writer.write({ type: 'data-metrics', data: event.data });
                break;
              case 'token':
                writer.write({ type: 'data-token', data: event.data, transient: true });
                break;
              case 'error':
                writer.write({
                  type: 'error',
                  errorText: String(event.data.message ?? 'Review failed'),
                });
                break;
              default:
                break;
            }
          }
        }
      } finally {
        writer.write({ type: 'text-end', id: textId });
        writer.write({ type: 'finish', finishReason: 'stop' });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
