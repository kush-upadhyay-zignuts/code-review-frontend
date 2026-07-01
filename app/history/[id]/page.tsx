'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { AppShell } from '@/components/app-shell';
import { MonacoCodeEditor } from '@/components/monaco-code-editor';
import { IssueCard, ReviewSummaryCard } from '@/components/review-ui';
import { SplitReviewLayout } from '@/components/split-review-layout';
import { apiFetch } from '@/lib/api';
import { formatReviewLanguage, getMonacoLanguage } from '@/lib/language-utils';
import type { ReviewHistoryItem } from '@/lib/types';

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<
    (ReviewHistoryItem & { code?: string }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      void apiFetch<ReviewHistoryItem & { code?: string }>(`/reviews/${params.id}`)
        .then(setReview)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
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
          <Box sx={{ mb: 4, flexShrink: 0, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width={140} height={20} />
              <Skeleton variant="text" width={220} height={40} sx={{ mt: 1 }} />
              <Skeleton variant="text" width={280} height={24} />
            </Box>
            <Skeleton variant="rounded" width={100} height={32} />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <SplitReviewLayout
              left={
                <Paper elevation={0} sx={{ flex: 1, overflow: 'hidden', p: 0.5, minHeight: 0 }}>
                  <Skeleton variant="rounded" sx={{ width: '100%', height: { xs: 360, lg: '100%' }, minHeight: 360 }} />
                </Paper>
              }
              right={
                <>
                  <Paper elevation={0} sx={{ p: 2.5 }}>
                    <Skeleton variant="text" width="35%" height={28} />
                    <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="92%" height={20} />
                    <Skeleton variant="text" width="78%" height={20} />
                    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                      <Skeleton variant="rounded" width={80} height={28} />
                      <Skeleton variant="rounded" width={80} height={28} />
                      <Skeleton variant="rounded" width={80} height={28} />
                    </Box>
                  </Paper>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Paper key={index} elevation={0} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                        <Skeleton variant="rounded" width={72} height={24} />
                        <Skeleton variant="rounded" width={88} height={24} />
                      </Box>
                      <Skeleton variant="text" width="70%" height={24} />
                      <Skeleton variant="text" width="100%" height={20} sx={{ mt: 1 }} />
                      <Skeleton variant="text" width="95%" height={20} />
                      <Skeleton variant="rounded" height={72} sx={{ mt: 1.5 }} />
                    </Paper>
                  ))}
                </>
              }
            />
          </Box>
        </Container>
      </AppShell>
    );
  }

  if (!review) {
    return (
      <AppShell>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Review not found.</Typography>
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
            <Typography variant="h4" sx={{ mt: 1 }}>
              {formatReviewLanguage(review.language)} review
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
                language={getMonacoLanguage(review.language)}
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
