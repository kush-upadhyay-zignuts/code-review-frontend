'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AppShell } from '@/components/app-shell';
import { DeleteReviewDialog } from '@/components/delete-review-dialog';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { ReviewHistoryItem } from '@/lib/types';

export default function HistoryPage() {
  const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void apiFetch<ReviewHistoryItem[]>('/reviews').then(setReviews);
  }, []);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    setDeleting(true);
    try {
      await apiFetch(`/reviews/${deleteTargetId}`, { method: 'DELETE' });
      setReviews((current) => current.filter((r) => r._id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete review',
        'delete-review-error',
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary">
            History
          </Typography>
          <Typography variant="h4">Past reviews</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {reviews.map((review) => (
            <Paper key={review._id} elevation={0} sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { sm: 'center' } }}>
                <Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip label={review.language} size="small" color="primary" variant="outlined" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Score {review.overallScore}/10
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {review.totalTokens} tokens · {new Date(review.createdAt).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button component={Link} href={`/history/${review._id}`} variant="outlined" size="small">
                    View
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => setDeleteTargetId(review._id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            </Paper>
          ))}
          {reviews.length === 0 && (
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No reviews yet.{' '}
                <Link href="/review" style={{ color: '#60a5fa' }}>
                  Run your first review
                </Link>
              </Typography>
            </Paper>
          )}
        </Box>
      </Container>

      <DeleteReviewDialog
        open={deleteTargetId !== null}
        deleting={deleting}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </AppShell>
  );
}
