import type { ReviewSummary, TokenUsage } from '@/lib/types';

export type ReviewOutcome =
  | 'incomplete'
  | 'error'
  | 'truncated'
  | 'clean';

export function resolveReviewOutcome(input: {
  streamCompleted: boolean;
  streamError: string | null;
  tokens: TokenUsage | null;
  summary: ReviewSummary | null;
  issueCount: number;
}): ReviewOutcome | null {
  const { streamCompleted, streamError, tokens, summary, issueCount } = input;

  if (streamError) {
    return 'error';
  }

  const tokensUsed = tokens?.used ?? 0;
  const succeeded = streamCompleted || tokensUsed > 0 || summary !== null;

  if (!succeeded) {
    return 'incomplete';
  }

  if (
    issueCount === 0 &&
    (tokens?.outputTokens ?? 0) >= 14_000 &&
    !summary
  ) {
    return 'truncated';
  }

  if (issueCount === 0) {
    return 'clean';
  }

  return null;
}

export const INCOMPLETE_REVIEW_MESSAGE =
  'Review did not complete. The connection may have timed out — please try again.';

export const STREAM_STALL_MS = 120_000;
