'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AppShell } from '@/components/app-shell';
import { MonacoCodeEditor } from '@/components/monaco-code-editor';
import { IssueCard, ReviewSummaryCard } from '@/components/review-ui';
import { SplitReviewLayout } from '@/components/split-review-layout';
import { apiFetch } from '@/lib/api';
import type { ReviewHistoryItem, SupportedLanguage } from '@/lib/types';

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<
    (ReviewHistoryItem & { code?: string }) | null
  >(null);

  useEffect(() => {
    if (params.id) {
      void apiFetch<ReviewHistoryItem & { code?: string }>(`/reviews/${params.id}`).then(setReview);
    }
  }, [params.id]);

  if (!review) {
    return (
      <AppShell>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading review…</Typography>
          </Paper>
        </Container>
      </AppShell>
    );
  }

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
        <Box sx={{ mb: 4, flexShrink: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Link href="/history" style={{ color: '#60a5fa', fontSize: 14 }}>
              ← Back to history
            </Link>
            <Typography variant="h4" sx={{ mt: 1, textTransform: 'capitalize' }}>
              {review.language} review
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(review.createdAt).toLocaleString()} · {review.totalTokens} tokens
            </Typography>
          </Box>
          <Chip label={`Score ${review.overallScore}/10`} color="primary" />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
        <SplitReviewLayout
          left={
            <Paper elevation={0} sx={{ flex: 1, overflow: 'hidden', p: 0.5, minHeight: 0 }}>
              <MonacoCodeEditor
                value={review.code ?? ''}
                language={review.language as SupportedLanguage}
                onChange={() => undefined}
                readOnly
              />
            </Paper>
          }
          right={
            <>
              {review.result && (
                <ReviewSummaryCard
                  summary={{
                    overallScore: review.result.overallScore,
                    summary: review.result.summary,
                  }}
                />
              )}
              {review.result?.issues.length ? (
                review.result.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} />
                ))
              ) : (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary">No issues recorded for this review.</Typography>
                </Paper>
              )}
            </>
          }
        />
        </Box>
      </Container>
    </AppShell>
  );
}
