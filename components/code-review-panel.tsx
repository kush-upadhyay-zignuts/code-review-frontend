'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { AppShell } from '@/components/app-shell';
import { MonacoCodeEditor } from '@/components/monaco-code-editor';
import { StreamingIssueCard } from '@/components/streaming-issue-card';
import { ApiError, openReviewStream } from '@/lib/api';
import { validateCodeInput } from '@/lib/code-input-validator';
import { useAuthStore } from '@/lib/auth-store';
import { issueKey, normalizeIssue } from '@/lib/stream-issue-parser';
import { parseSseChunk, type ParsedSseEvent } from '@/lib/sse-parser';
import type {
  ReviewIssue,
  ReviewMetrics,
  ReviewSummary,
  ReviewPhase,
  TokenUsage,
} from '@/lib/types';
import { SplitReviewLayout } from '@/components/split-review-layout';
import { toast } from '@/lib/toast';
import { formatReviewLanguage } from '@/lib/language-utils';
import { NON_CODE_INPUT_MESSAGE } from '@/lib/non-code-detection';
import {
  IssueCard,
  PhaseProgress,
  ReviewSummaryCard,
  CleanReviewBanner,
  NotCodeBanner,
  TokenUsageBar,
} from '@/components/review-ui';
import {
  INCOMPLETE_REVIEW_MESSAGE,
  resolveReviewOutcome,
  STREAM_STALL_MS,
} from '@/lib/review-outcome';

const DEFAULT_CODE = `function divide(a, b) {
  return a / b;
}

console.log(divide(10, 0));`;

const initialPhases = (): Record<ReviewPhase, 'pending' | 'active' | 'done'> => ({
  analyzing_syntax: 'pending',
  checking_security: 'pending',
  checking_performance: 'pending',
  checking_style: 'pending',
  validating_findings: 'pending',
});

export function CodeReviewPanel() {
  const token = useAuthStore((s) => s.accessToken);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [revealedIssues, setRevealedIssues] = useState<ReviewIssue[]>([]);
  const [liveIssue, setLiveIssue] = useState<ReviewIssue | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [phases, setPhases] = useState(initialPhases);
  const [isStreaming, setIsStreaming] = useState(false);
  const [validating, setValidating] = useState(false);
  const [issuesStreaming, setIssuesStreaming] = useState(false);
  const [reviewActive, setReviewActive] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [streamCompleted, setStreamCompleted] = useState(false);
  const [partialNotice, setPartialNotice] = useState<string | null>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const issueQueueRef = useRef<ReviewIssue[]>([]);
  const processingRef = useRef(false);
  const liveIssueRef = useRef<ReviewIssue | null>(null);
  const pendingSummaryRef = useRef<ReviewSummary | null>(null);
  const pendingMetricsRef = useRef<ReviewMetrics | null>(null);
  const completeResolverRef = useRef<(() => void) | null>(null);
  const seenIssueKeysRef = useRef<Set<string>>(new Set());
  const streamEndedRef = useRef(false);
  const streamCompletedRef = useRef(false);
  const streamErrorRef = useRef<string | null>(null);
  const tokensRef = useRef<TokenUsage | null>(null);
  const summaryRef = useRef<ReviewSummary | null>(null);
  const abortDueToStallRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  }, []);

  const resetStreamTracking = useCallback(() => {
    streamCompletedRef.current = false;
    setStreamCompleted(false);
    streamErrorRef.current = null;
    tokensRef.current = null;
    summaryRef.current = null;
    abortDueToStallRef.current = false;
    clearStallTimer();
  }, [clearStallTimer]);

  const scheduleStallWatch = useCallback((controller: AbortController) => {
    clearStallTimer();
    stallTimerRef.current = setTimeout(() => {
      abortDueToStallRef.current = true;
      streamErrorRef.current = INCOMPLETE_REVIEW_MESSAGE;
      setStreamError(INCOMPLETE_REVIEW_MESSAGE);
      controller.abort();
    }, STREAM_STALL_MS);
  }, [clearStallTimer]);

  const resetIssuePipeline = useCallback(() => {
    completeResolverRef.current?.();
    completeResolverRef.current = null;
    processingRef.current = false;
    issueQueueRef.current = [];
    seenIssueKeysRef.current.clear();
    setLiveIssue(null);
    liveIssueRef.current = null;
    setIssuesStreaming(false);
  }, []);

  const tryFlushPendingResults = useCallback(() => {
    if (
      processingRef.current ||
      issueQueueRef.current.length > 0 ||
      liveIssueRef.current
    ) {
      return;
    }

    if (pendingSummaryRef.current) {
      setSummary(pendingSummaryRef.current);
      pendingSummaryRef.current = null;
    }
    if (pendingMetricsRef.current) {
      setMetrics(pendingMetricsRef.current);
      pendingMetricsRef.current = null;
    }
  }, []);

  const tryFinalizeReviewRef = useRef<() => void>(() => {});

  const tryFinalizeReview = useCallback(() => {
    if (
      !streamEndedRef.current ||
      processingRef.current ||
      issueQueueRef.current.length > 0 ||
      liveIssueRef.current
    ) {
      return;
    }

    setReviewActive(false);
    setReviewComplete(true);
    setIsStreaming(false);
    setValidating(false);
    tryFlushPendingResults();
  }, [tryFlushPendingResults]);

  tryFinalizeReviewRef.current = tryFinalizeReview;

  const scrollIssues = useCallback(() => {
    requestAnimationFrame(() => {
      rightPanelRef.current?.scrollTo({
        top: rightPanelRef.current.scrollHeight,
        behavior: 'smooth',
      });
    });
  }, []);

  const processIssueQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIssuesStreaming(true);

    while (issueQueueRef.current.length > 0) {
      const next = issueQueueRef.current.shift();
      if (!next) break;

      setLiveIssue(next);
      liveIssueRef.current = next;
      scrollIssues();

      await new Promise<void>((resolve) => {
        completeResolverRef.current = resolve;
      });

      setRevealedIssues((current) => {
        const key = issueKey(next);
        if (current.some((i) => issueKey(i) === key)) return current;
        return [...current, next];
      });
      setLiveIssue(null);
      liveIssueRef.current = null;
      scrollIssues();
      await new Promise((r) => setTimeout(r, 200));
    }

    processingRef.current = false;
    setIssuesStreaming(false);
    tryFlushPendingResults();
    tryFinalizeReviewRef.current();
  }, [scrollIssues, tryFlushPendingResults]);

  const enqueueIssue = useCallback(
    (issue: ReviewIssue) => {
      const key = issueKey(issue);
      if (seenIssueKeysRef.current.has(key)) return;
      seenIssueKeysRef.current.add(key);
      issueQueueRef.current.push(issue);
      void processIssueQueue();
    },
    [processIssueQueue],
  );

  const handleIssueRevealComplete = useCallback(() => {
    completeResolverRef.current?.();
    completeResolverRef.current = null;
  }, []);

  const handleStreamEvent = useCallback(
    (event: ParsedSseEvent) => {
      switch (event.event) {
        case 'phase': {
          const { phase, status: phaseStatus } = event.data as {
            phase: ReviewPhase;
            status: string;
          };
          if (phase === 'validating_findings' && phaseStatus === 'started') {
            setValidating(true);
          }
          if (phase === 'validating_findings' && phaseStatus === 'complete') {
            setValidating(false);
          }
          setPhases((current) => ({
            ...current,
            [phase]:
              phaseStatus === 'complete'
                ? 'done'
                : phaseStatus === 'started'
                  ? 'active'
                  : current[phase],
          }));
          break;
        }
        case 'issue': {
          const issue = normalizeIssue(event.data);
          if (issue) enqueueIssue(issue);
          break;
        }
        case 'summary': {
          const summaryData = event.data as unknown as ReviewSummary;
          pendingSummaryRef.current = summaryData;
          summaryRef.current = summaryData;
          if (summaryData.language) {
            setDetectedLanguage(formatReviewLanguage(summaryData.language));
          }
          tryFlushPendingResults();
          break;
        }
        case 'metrics':
          pendingMetricsRef.current = event.data as unknown as ReviewMetrics;
          tryFlushPendingResults();
          break;
        case 'token': {
          const tokenData = event.data as unknown as TokenUsage;
          tokensRef.current = tokenData;
          setTokens(tokenData);
          break;
        }
        case 'done':
          streamCompletedRef.current = true;
          setStreamCompleted(true);
          break;
        case 'ping':
          break;
        case 'notice':
          setPartialNotice(String(event.data.message ?? ''));
          break;
        case 'error': {
          const message = String(event.data.message ?? 'Review failed');
          streamErrorRef.current = message;
          setStreamError(message);
          if (message === NON_CODE_INPUT_MESSAGE) {
            setCodeError(message);
          }
          toast.error(message, 'review-error');
          break;
        }
        default:
          break;
      }
    },
    [enqueueIssue, tryFlushPendingResults],
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    streamEndedRef.current = true;
    setIsStreaming(false);
    setValidating(false);
    setReviewActive(false);
  }, []);

  const isReviewInProgress =
    reviewActive || isStreaming || issuesStreaming || validating || liveIssue !== null;
  const issueCount = revealedIssues.length + (liveIssue ? 1 : 0);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    setCodeError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || !token) return;

    const validation = validateCodeInput(code);
    if (!validation.valid) {
      setCodeError(validation.error ?? 'Invalid code input.');
      toast.error(validation.error ?? 'Invalid code input.', 'code-validation-error');
      return;
    }

    setCodeError(null);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    resetStreamTracking();

    setIsStreaming(true);
    setReviewActive(true);
    setReviewComplete(false);
    setDetectedLanguage(null);
    setStreamError(null);
    setPartialNotice(null);
    streamEndedRef.current = false;
    setRevealedIssues([]);
    resetIssuePipeline();
    setSummary(null);
    setMetrics(null);
    pendingSummaryRef.current = null;
    pendingMetricsRef.current = null;
    setTokens(null);
    setValidating(false);
    setPhases(initialPhases());
    scheduleStallWatch(controller);

    try {
      const response = await openReviewStream(code, {
        signal: controller.signal,
      });

      const body = response.body;
      if (!body) {
        throw new Error('Review stream returned no data.');
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const onStreamActivity = () => {
        scheduleStallWatch(controller);
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        onStreamActivity();
        buffer += decoder.decode(value, { stream: true });
        const { events, remainder } = parseSseChunk(buffer);
        buffer = remainder;

        for (const streamEvent of events) {
          onStreamActivity();
          handleStreamEvent(streamEvent);
        }
      }

      if (buffer.trim()) {
        const { events } = parseSseChunk(`${buffer}\n\n`);
        for (const streamEvent of events) {
          onStreamActivity();
          handleStreamEvent(streamEvent);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        if (abortDueToStallRef.current) {
          toast.error(INCOMPLETE_REVIEW_MESSAGE, 'review-stall-error');
        }
        return;
      }

      const message =
        error instanceof Error ? error.message : 'Review failed';

      streamErrorRef.current = message;
      if (error instanceof ApiError && error.status === 400) {
        setCodeError(message);
      } else {
        setStreamError(message);
      }

      toast.error(message, 'review-error');
      setReviewActive(false);
    } finally {
      clearStallTimer();
      abortRef.current = null;
      streamEndedRef.current = true;
      setIsStreaming(false);

      if (
        !streamCompletedRef.current &&
        !streamErrorRef.current &&
        (tokensRef.current?.used ?? 0) === 0 &&
        !summaryRef.current
      ) {
        streamErrorRef.current = INCOMPLETE_REVIEW_MESSAGE;
        setStreamError(INCOMPLETE_REVIEW_MESSAGE);
        toast.error(INCOMPLETE_REVIEW_MESSAGE, 'review-incomplete-error');
        setReviewActive(false);
      }

      tryFinalizeReviewRef.current();
    }
  }, [
    code,
    clearStallTimer,
    handleStreamEvent,
    resetIssuePipeline,
    resetStreamTracking,
    scheduleStallWatch,
    token,
  ]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      clearStallTimer();
    };
  }, [clearStallTimer]);

  const reviewOutcome =
    reviewComplete && !issuesStreaming
      ? resolveReviewOutcome({
          streamCompleted,
          streamError,
          tokens,
          summary,
          issueCount,
          language: detectedLanguage,
        })
      : null;

  return (
    <AppShell>
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          display: 'flex',
          flexDirection: 'column',
          height: { lg: 'calc(100vh - 64px)' },
          overflow: { lg: 'hidden' },
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ mb: 4, flexShrink: 0 }}>
          <Typography variant="overline" color="secondary.main">
            Code Review
          </Typography>
          <Typography variant="h4" color="text.primary">
            Evidence-based analysis
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Findings are validated against your code — only issues with &ge;80% confidence are shown. Language is auto-detected.
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
        <SplitReviewLayout
          ref={rightPanelRef}
          left={
            <>
              <Paper elevation={0} sx={{ flex: 1, overflow: 'hidden', p: 0.5, minHeight: 0 }}>
                <MonacoCodeEditor
                  value={code}
                  onChange={handleCodeChange}
                  readOnly={isReviewInProgress}
                />
              </Paper>
              {codeError && (
                <Alert severity="error" onClose={() => setCodeError(null)}>
                  {codeError}
                </Alert>
              )}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', flexShrink: 0 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => void handleSubmit()}
                  disabled={isReviewInProgress || !code.trim()}
                >
                  {isReviewInProgress ? 'Analyzing…' : 'Review Code'}
                </Button>
                {isStreaming && (
                  <Button variant="outlined" onClick={handleStop}>
                    Stop
                  </Button>
                )}
              </Box>
            </>
          }
          right={
            <>
              {isStreaming && <PhaseProgress phases={phases} />}
              <TokenUsageBar usage={tokens} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Confirmed issues ({issueCount})
                  </Typography>
                  {detectedLanguage && detectedLanguage !== '—' && (
                    <Chip label={detectedLanguage} size="small" color="secondary" variant="outlined" />
                  )}
                  {issuesStreaming && (
                    <Chip label="Live" size="small" color="primary" variant="outlined" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {partialNotice && (
                    <Alert severity="info">{partialNotice}</Alert>
                  )}
                  {revealedIssues.map((issue, i) => (
                    <IssueCard key={`${issueKey(issue)}-${i}`} issue={issue} />
                  ))}
                  {liveIssue && (
                    <StreamingIssueCard
                      key={issueKey(liveIssue)}
                      issue={liveIssue}
                      onComplete={handleIssueRevealComplete}
                    />
                  )}
                  {validating && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary">
                        Cross-checking findings against your source code…
                      </Typography>
                    </Paper>
                  )}
                  {!issueCount && !validating && isStreaming && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary">
                        Scanning code — confirmed issues will stream in shortly
                      </Typography>
                    </Paper>
                  )}
                  {!issueCount && !validating && !isStreaming && issuesStreaming && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary">
                        Streaming confirmed findings…
                      </Typography>
                    </Paper>
                  )}
                  {!issueCount && !reviewActive && !reviewComplete && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary">
                        Evidence-backed issues will stream here after analysis
                      </Typography>
                    </Paper>
                  )}
                  {reviewOutcome === 'error' && !issueCount && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="error.main">
                        {streamError}
                      </Typography>
                    </Paper>
                  )}
                  {reviewOutcome === 'incomplete' && !issueCount && (
                    <Alert severity="warning">
                      {INCOMPLETE_REVIEW_MESSAGE}
                    </Alert>
                  )}
                  {reviewOutcome === 'truncated' && !issueCount && (
                    <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                      <Typography variant="body2" color="text.secondary">
                        The AI response was likely cut off before findings could be returned. Try again or paste a shorter snippet.
                      </Typography>
                    </Paper>
                  )}
                  {reviewOutcome === 'not_code' && !issueCount && (
                    <NotCodeBanner language={detectedLanguage} />
                  )}
                  {reviewOutcome === 'clean' && !issueCount && (
                    <CleanReviewBanner
                      summary={summary}
                      language={detectedLanguage}
                    />
                  )}
                </Box>
              </Box>
              <ReviewSummaryCard summary={summary} metrics={metrics} />
            </>
          }
        />
        </Box>
      </Container>
    </AppShell>
  );
}
