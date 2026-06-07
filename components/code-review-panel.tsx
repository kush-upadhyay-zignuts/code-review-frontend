'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { AppShell } from '@/components/app-shell';
import { MonacoCodeEditor } from '@/components/monaco-code-editor';
import { StreamingIssueCard } from '@/components/streaming-issue-card';
import { useAuthStore } from '@/lib/auth-store';
import { issueKey } from '@/lib/stream-issue-parser';
import type {
  ReviewIssue,
  ReviewMetrics,
  ReviewSummary,
  ReviewPhase,
  SupportedLanguage,
  TokenUsage,
} from '@/lib/types';
import {
  IssueCard,
  LanguageSelect,
  PhaseProgress,
  ReviewSummaryCard,
  StreamingTextPanel,
  TokenUsageBar,
} from '@/components/review-ui';

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
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [revealedIssues, setRevealedIssues] = useState<ReviewIssue[]>([]);
  const [liveIssue, setLiveIssue] = useState<ReviewIssue | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [metrics, setMetrics] = useState<ReviewMetrics | null>(null);
  const [tokens, setTokens] = useState<TokenUsage | null>(null);
  const [phases, setPhases] = useState(initialPhases);
  const [streamText, setStreamText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [issuesStreaming, setIssuesStreaming] = useState(false);
  const streamRef = useRef<HTMLDivElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);
  const issueQueueRef = useRef<ReviewIssue[]>([]);
  const processingRef = useRef(false);
  const completeResolverRef = useRef<(() => void) | null>(null);
  const seenIssueKeysRef = useRef<Set<string>>(new Set());

  const scrollIssues = useCallback(() => {
    requestAnimationFrame(() => {
      issuesRef.current?.scrollTo({
        top: issuesRef.current.scrollHeight,
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
      scrollIssues();
      await new Promise((r) => setTimeout(r, 280));
    }

    processingRef.current = false;
    setIssuesStreaming(false);
  }, [scrollIssues]);

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

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/code-review' }),
    [],
  );

  const { sendMessage, status, error, stop } = useChat({
    transport,
    onData: (dataPart) => {
      if (dataPart.type === 'data-text') {
        const chunk = (dataPart.data as { content?: string }).content ?? '';
        setStreamText((current) => {
          const next = current + chunk;
          requestAnimationFrame(() => {
            streamRef.current?.scrollTo({
              top: streamRef.current.scrollHeight,
              behavior: 'smooth',
            });
          });
          return next;
        });
      }
      if (dataPart.type === 'data-phase') {
        const { phase, status: phaseStatus } = dataPart.data as {
          phase: ReviewPhase;
          status: string;
        };
        if (phase === 'validating_findings' && phaseStatus === 'started') {
          setValidating(true);
          setRevealedIssues([]);
          setLiveIssue(null);
          issueQueueRef.current = [];
          seenIssueKeysRef.current.clear();
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
      }
      if (dataPart.type === 'data-issue') {
        enqueueIssue(dataPart.data as ReviewIssue);
      }
      if (dataPart.type === 'data-summary') {
        setSummary(dataPart.data as ReviewSummary);
      }
      if (dataPart.type === 'data-metrics') {
        setMetrics(dataPart.data as ReviewMetrics);
      }
      if (dataPart.type === 'data-token') {
        setTokens(dataPart.data as TokenUsage);
      }
    },
  });

  const isStreaming = status === 'streaming' || status === 'submitted' || submitting;
  const issueCount = revealedIssues.length + (liveIssue ? 1 : 0);

  const handleSubmit = useCallback(async () => {
    if (!code.trim() || isStreaming || !token) return;

    setSubmitting(true);
    setRevealedIssues([]);
    setLiveIssue(null);
    issueQueueRef.current = [];
    seenIssueKeysRef.current.clear();
    processingRef.current = false;
    setSummary(null);
    setMetrics(null);
    setTokens(null);
    setStreamText('');
    setValidating(false);
    setIssuesStreaming(false);
    setPhases(initialPhases());

    try {
      await sendMessage(
        { text: `Review ${language} code` },
        {
          body: { code, language },
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } finally {
      setSubmitting(false);
      setValidating(false);
    }
  }, [code, isStreaming, language, sendMessage, token]);

  return (
    <AppShell>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { sm: 'flex-end' } }}>
          <Box>
            <Typography variant="overline" color="secondary.main">
              Code Review
            </Typography>
            <Typography variant="h4" color="text.primary">
              Evidence-based analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Findings are validated against your code — only issues with &ge;80% confidence are shown.
            </Typography>
          </Box>
          <LanguageSelect value={language} onChange={setLanguage} disabled={isStreaming} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, gap: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minHeight: 460 }}>
            <Paper elevation={0} sx={{ flex: 1, overflow: 'hidden', p: 0.5 }}>
              <MonacoCodeEditor
                value={code}
                language={language}
                onChange={setCode}
                readOnly={isStreaming}
              />
            </Paper>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => void handleSubmit()}
                disabled={isStreaming || !code.trim()}
              >
                {isStreaming ? 'Analyzing…' : 'Review Code'}
              </Button>
              {isStreaming && (
                <Button variant="outlined" onClick={() => stop()}>
                  Stop
                </Button>
              )}
            </Box>
            {error && <Alert severity="error">{error.message}</Alert>}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {isStreaming && <PhaseProgress phases={phases} />}
            {(isStreaming || streamText) && (
              <StreamingTextPanel ref={streamRef} text={streamText} active={isStreaming && !validating && !issuesStreaming} />
            )}
            <TokenUsageBar usage={tokens} />
            <ReviewSummaryCard summary={summary} metrics={metrics} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Confirmed issues ({issueCount})
                </Typography>
                {issuesStreaming && (
                  <Chip label="Live" size="small" color="primary" variant="outlined" />
                )}
              </Box>
              <Box
                ref={issuesRef}
                sx={{ maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, pr: 0.5 }}
              >
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
                {!issueCount && !isStreaming && (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed' }}>
                    <Typography variant="body2" color="text.secondary">
                      Evidence-backed issues will stream here after analysis
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </AppShell>
  );
}
