'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    void apiFetch<DashboardStats>('/dashboard/stats').then(setStats);
  }, []);

  const cards = [
    { label: 'Total Reviews', value: stats?.totalReviews ?? '—' },
    { label: 'Tokens Used', value: stats?.monthlyUsed?.toLocaleString() ?? '—' },
    { label: 'Average Score', value: stats ? `${stats.averageScore}/10` : '—' },
    { label: 'Top Language', value: stats?.topLanguages[0]?.language ?? '—' },
  ];

  const greeting = user?.firstName ? `Hey ${user.firstName}` : 'Welcome';
  const percent = stats
    ? Math.min(100, (stats.monthlyUsed / stats.monthlyBudget) * 100)
    : 0;

  return (
    <AppShell>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2, alignItems: { sm: 'flex-end' } }}>
          <Box>
            <Typography variant="overline" color="primary.light">
              Dashboard
            </Typography>
            <Typography variant="h4">{greeting}, ready to review?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Track your reviews, token usage, and code quality scores in one place.
            </Typography>
          </Box>
          <Button component={Link} href="/review" variant="contained" size="large">
            + New Review
          </Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {cards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, xl: 3 }}>
              <Paper elevation={0} sx={{ p: 2.5, height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, textTransform: 'capitalize' }}>
                  {card.value}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {stats && (
          <Paper elevation={0} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h6">Monthly token budget</Typography>
                <Typography variant="body2" color="text.secondary">
                  Resets on the 1st of each month
                </Typography>
              </Box>
              <Typography variant="body2" color="primary.light">
                {Math.round(percent)}% used
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {stats.monthlyUsed.toLocaleString()} used
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.monthlyBudget.toLocaleString()} limit
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, height: 10 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {stats.monthlyRemaining.toLocaleString()} tokens remaining
            </Typography>
          </Paper>
        )}
      </Container>
    </AppShell>
  );
}
