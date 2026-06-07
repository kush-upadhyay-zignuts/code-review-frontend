import type { IssueSeverity, ReviewIssue, ReviewSummary } from './types';

export interface StreamingReviewIssue extends ReviewIssue {
  streaming: true;
}

export interface StreamParseResult {
  issues: ReviewIssue[];
  partialIssue: StreamingReviewIssue | null;
  summary: ReviewSummary | null;
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeSeverity(value: unknown): IssueSeverity {
  const severity = String(value ?? 'medium').toLowerCase();
  if (['critical', 'high', 'medium', 'low'].includes(severity)) {
    return severity as IssueSeverity;
  }
  return 'medium';
}

function normalizeIssue(parsed: Record<string, unknown>): ReviewIssue | null {
  const explanation =
    readString(parsed.explanation) || readString(parsed.message);
  const title = readString(parsed.title) || explanation.slice(0, 80);
  if (!title && !explanation) return null;

  const category =
    readString(parsed.category) ||
    readString(parsed.issueType) ||
    readString(parsed.type) ||
    'General';

  const suggestedFix =
    readString(parsed.suggestedFix) || readString(parsed.suggestion);

  return {
    title,
    category: ['issue', 'phase', 'summary'].includes(category) ? 'General' : category,
    type: ['issue', 'phase', 'summary'].includes(category) ? 'General' : category,
    severity: normalizeSeverity(parsed.severity),
    line: typeof parsed.line === 'number' ? parsed.line : null,
    explanation,
    message: explanation,
    evidence: readString(parsed.evidence),
    suggestedFix,
    suggestion: suggestedFix,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 100,
  };
}

function extractStringField(text: string, key: string, allowOpen = false): string {
  const complete = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const completeMatch = text.match(complete);
  if (completeMatch) {
    return completeMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (!allowOpen) return '';
  const open = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`);
  const openMatch = text.match(open);
  return openMatch
    ? openMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
    : '';
}

function extractNumberField(text: string, key: string): number | null {
  const match = text.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
  return match ? Number(match[1]) : null;
}

function extractCompleteJsonObjects(buffer: string): {
  objects: Record<string, unknown>[];
  remainder: string;
} {
  const objects: Record<string, unknown>[] = [];
  let i = 0;

  while (i < buffer.length) {
    while (i < buffer.length && /\s/.test(buffer[i])) i += 1;
    if (i >= buffer.length) break;

    if (buffer[i] !== '{') {
      const next = buffer.indexOf('{', i);
      if (next === -1) return { objects, remainder: buffer.slice(i) };
      i = next;
    }

    const start = i;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (; i < buffer.length; i += 1) {
      const char = buffer[i];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          const slice = buffer.slice(start, i + 1);
          const parsed = tryParseJson(slice);
          if (parsed) objects.push(parsed);
          i += 1;
          break;
        }
      }
    }

    if (depth !== 0) {
      return { objects, remainder: buffer.slice(start) };
    }
  }

  return { objects, remainder: buffer.slice(i) };
}

function parsePartialIssue(remainder: string): StreamingReviewIssue | null {
  const trimmed = remainder.trim();
  if (!trimmed.startsWith('{')) return null;

  const isIssue =
    trimmed.includes('"type":"issue"') ||
    trimmed.includes('"type": "issue"') ||
    (trimmed.includes('"severity"') && !trimmed.includes('"type":"phase"'));

  if (!isIssue) return null;

  const title = extractStringField(trimmed, 'title', true);
  const explanation =
    extractStringField(trimmed, 'explanation', true) ||
    extractStringField(trimmed, 'message', true);
  const suggestedFix =
    extractStringField(trimmed, 'suggestedFix', true) ||
    extractStringField(trimmed, 'suggestion', true);
  const category =
    extractStringField(trimmed, 'category', true) ||
    extractStringField(trimmed, 'issueType', true) ||
    extractStringField(trimmed, 'type', true);
  const severityRaw = extractStringField(trimmed, 'severity', true);
  const evidence = extractStringField(trimmed, 'evidence', true);

  if (!title && !explanation && !severityRaw) return null;

  const cat = category && !['issue', 'phase', 'summary'].includes(category) ? category : 'General';

  return {
    title: title || 'Analyzing issue…',
    category: cat,
    type: cat,
    severity: severityRaw ? normalizeSeverity(severityRaw) : 'medium',
    line: extractNumberField(trimmed, 'line'),
    explanation: explanation || '',
    message: explanation || '',
    evidence,
    suggestedFix,
    suggestion: suggestedFix,
    confidence: extractNumberField(trimmed, 'confidence') ?? 0,
    streaming: true,
  };
}

function eventFromParsed(parsed: Record<string, unknown>): {
  kind: 'issue' | 'summary' | 'phase' | 'skip';
  issue?: ReviewIssue;
  summary?: ReviewSummary;
} {
  if (parsed.type === 'phase' || (parsed.phase && parsed.status)) {
    return { kind: 'phase' };
  }

  if (parsed.type === 'issue' || (parsed.severity && parsed.message)) {
    const issue = normalizeIssue(parsed);
    return issue ? { kind: 'issue', issue } : { kind: 'skip' };
  }

  if (parsed.type === 'summary' || parsed.summary) {
    return {
      kind: 'summary',
      summary: {
        overallScore: Number(parsed.overallScore ?? 0),
        summary: readString(parsed.summary),
      },
    };
  }

  if (Array.isArray(parsed.issues)) {
    return { kind: 'skip' };
  }

  return { kind: 'skip' };
}

/** Parse accumulated LLM stream text into completed + in-progress issues. */
export function parseStreamForIssues(fullText: string): StreamParseResult {
  const { objects, remainder } = extractCompleteJsonObjects(fullText);
  const issues: ReviewIssue[] = [];
  let summary: ReviewSummary | null = null;

  for (const parsed of objects) {
    if (Array.isArray(parsed.issues)) {
      for (const raw of parsed.issues) {
        if (typeof raw === 'object' && raw !== null) {
          const issue = normalizeIssue(raw as Record<string, unknown>);
          if (issue) issues.push(issue);
        }
      }
      if (parsed.summary) {
        summary = {
          overallScore: Number(parsed.overallScore ?? 0),
          summary: readString(parsed.summary),
        };
      }
      continue;
    }

    const result = eventFromParsed(parsed);
    if (result.kind === 'issue' && result.issue) issues.push(result.issue);
    if (result.kind === 'summary' && result.summary) summary = result.summary;
  }

  const partialIssue = parsePartialIssue(remainder);

  return { issues, partialIssue, summary };
}

export function issueKey(issue: Pick<ReviewIssue, 'title' | 'line' | 'message' | 'explanation'>): string {
  const text = issue.explanation || issue.message || '';
  return `${issue.title}|${issue.line ?? 'n'}|${text.slice(0, 40)}`;
}
