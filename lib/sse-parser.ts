export interface ParsedSseEvent {
  event: string;
  data: Record<string, unknown>;
}

export function parseSseChunk(buffer: string): {
  events: ParsedSseEvent[];
  remainder: string;
} {
  const events: ParsedSseEvent[] = [];
  const blocks = buffer.split('\n\n');

  const remainder = blocks.pop() ?? '';

  for (const block of blocks) {
    if (!block.trim()) continue;

    let event = 'message';
    let data = '';

    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      }
    }

    if (!data) continue;

    try {
      events.push({
        event,
        data: JSON.parse(data) as Record<string, unknown>,
      });
    } catch {
      // skip malformed events
    }
  }

  return { events, remainder };
}
