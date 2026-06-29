'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import { AppShell } from '@/components/app-shell';
import { DeleteReviewDialog } from '@/components/delete-review-dialog';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import type { PaginatedReviewHistory, ReviewHistoryItem } from '@/lib/types';

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const [reviews, setReviews] = useState<ReviewHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const data = await apiFetch<PaginatedReviewHistory>(
        `/reviews?page=${pageNum}&limit=${PAGE_SIZE}`,
      );
      setReviews(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to load reviews',
        'history-load-error',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchReviews(page);
  }, [page, fetchReviews]);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    setDeleting(true);
    try {
      await apiFetch(`/reviews/${deleteTargetId}`, { method: 'DELETE' });
      setDeleteTargetId(null);

      if (reviews.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await fetchReviews(page);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete review',
        'delete-review-error',
      );
    } finally {
      setDeleting(false);
    }
  };

  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" color="text.secondary">
            History
          </Typography>
          <Typography variant="h4">Past reviews</Typography>
          {!loading && total > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Showing {rangeStart}–{rangeEnd} of {total} reviews
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading &&
            Array.from({ length: 3 }).map((_, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    gap: 2,
                    alignItems: { sm: 'center' },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Skeleton variant="rounded" width={72} height={24} />
                      <Skeleton variant="text" width={100} height={24} />
                    </Box>
                    <Skeleton variant="text" width="55%" height={20} sx={{ mt: 1 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Skeleton variant="rounded" width={64} height={32} />
                    <Skeleton variant="rounded" width={72} height={32} />
                  </Box>
                </Box>
              </Paper>
            ))}
          {!loading &&
            reviews.map((review) => (
              <Paper key={review._id} elevation={0} sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    gap: 2,
                    alignItems: { sm: 'center' },
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip
                        label={review.language}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Score {review.overallScore}/10
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {review.totalTokens} tokens · {new Date(review.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      component={Link}
                      href={`/history/${review._id}`}
                      variant="outlined"
                      size="small"
                    >
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
          {!loading && reviews.length === 0 && (
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

        {!loading && totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Box>
        )}
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
