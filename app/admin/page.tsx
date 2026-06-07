'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { AppShell } from '@/components/app-shell';
import { apiFetch } from '@/lib/api';

interface AdminAnalytics {
  totalUsers: number;
  totalReviews: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  averageScore: number;
  averageResponseTimeMs: number;
  rateLimitMax: number;
  monthlyTokenBudget: number;
  redisEnabled: boolean;
}

const metricConfig: {
  key: keyof AdminAnalytics;
  label: string;
  format?: (value: AdminAnalytics[keyof AdminAnalytics]) => string;
}[] = [
  { key: 'totalUsers', label: 'Total Users' },
  { key: 'totalReviews', label: 'Total Reviews' },
  { key: 'totalTokens', label: 'Total Tokens', format: (v) => Number(v).toLocaleString() },
  { key: 'totalInputTokens', label: 'Input Tokens', format: (v) => Number(v).toLocaleString() },
  { key: 'totalOutputTokens', label: 'Output Tokens', format: (v) => Number(v).toLocaleString() },
  { key: 'averageScore', label: 'Average Score', format: (v) => `${Number(v).toFixed(1)}/10` },
  { key: 'averageResponseTimeMs', label: 'Avg Response Time', format: (v) => `${Math.round(Number(v))} ms` },
  { key: 'rateLimitMax', label: 'Rate Limit (req/min)' },
  { key: 'monthlyTokenBudget', label: 'Monthly Token Budget', format: (v) => Number(v).toLocaleString() },
  { key: 'redisEnabled', label: 'Redis Enabled', format: (v) => (v ? 'Yes' : 'No (in-memory fallback)') },
];

export default function AdminPage() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    void apiFetch<AdminAnalytics>('/admin/analytics')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <AppShell>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="overline" color="secondary.light">
            Admin
          </Typography>
          <Typography variant="h4">Platform analytics</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Monitor usage, token consumption, and system configuration across all users.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {data && (
          <Grid container spacing={2}>
            {metricConfig.map(({ key, label, format }) => (
              <Grid key={key} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Paper elevation={0} sx={{ p: 2.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 1 }}>
                    {format ? format(data[key]) : String(data[key])}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {!data && !error && (
          <Paper elevation={0} sx={{ p: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">Loading analytics…</Typography>
          </Paper>
        )}
      </Container>
    </AppShell>
  );
}
