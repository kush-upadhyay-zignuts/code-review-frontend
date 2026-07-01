/**
 * Legacy BFF proxy for local dev only.
 * Production must stream from the browser to the backend (see openReviewStream):
 * Netlify/Vercel serverless functions time out (~10–26s) before a review finishes (~60–90s).
 */
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

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
