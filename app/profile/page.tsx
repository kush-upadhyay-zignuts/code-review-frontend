'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { AppShell } from '@/components/app-shell';
import { ChangePasswordForm } from '@/components/profile/change-password-form';
import { apiFetch } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useAuthStore } from '@/lib/auth-store';
import type { DashboardStats, UserAccountDetails } from '@/lib/types';

function getInitials(firstName?: string, lastName?: string, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? '?';
}

function formatDate(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ py: 1.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export default function ProfilePage() {
  const authUser = useAuthStore((s) => s.user);
  const [account, setAccount] = useState<UserAccountDetails | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<UserAccountDetails>('/auth/me'),
      apiFetch<DashboardStats>('/dashboard/stats'),
    ])
      .then(([accountData, statsData]) => {
        setAccount(accountData);
        setStats(statsData);
      })
      .catch(() => {
        toast.error('Failed to load profile data.', 'profile-load-error');
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = account?.firstName ?? authUser?.firstName;
  const lastName = account?.lastName ?? authUser?.lastName;
  const email = account?.email ?? authUser?.email ?? '';
  const fullName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName || email || 'User';
  const role = account?.role ?? authUser?.role ?? 'user';
  const percent = stats
    ? Math.min(100, (stats.monthlyUsed / stats.monthlyBudget) * 100)
    : 0;

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="overline" color="primary.light">
          Account
        </Typography>
        <Typography variant="h4" sx={{ mb: 4 }}>
          My Profile
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                <Skeleton variant="circular" width={72} height={72} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="45%" height={36} />
                  <Skeleton variant="text" width="60%" height={22} sx={{ mt: 0.5 }} />
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                    <Skeleton variant="rounded" width={88} height={24} />
                    <Skeleton variant="rounded" width={64} height={24} />
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <Grid key={index} size={{ xs: 12, sm: index >= 6 ? 12 : 6 }}>
                    <Skeleton variant="text" width="35%" height={18} />
                    <Skeleton variant="text" width={index % 2 === 0 ? '70%' : '55%'} height={28} sx={{ mt: 0.5 }} />
                  </Grid>
                ))}
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {Array.from({ length: 5 }).map((_, index) => (
                  <Grid key={index} size={{ xs: 12, sm: index === 4 ? 12 : 6 }}>
                    <Skeleton variant="text" width="40%" height={18} />
                    <Skeleton variant="text" width="50%" height={28} sx={{ mt: 0.5 }} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Skeleton variant="text" width={160} height={22} />
                  <Skeleton variant="text" width={72} height={22} />
                </Box>
                <Skeleton variant="rounded" height={8} sx={{ borderRadius: 1 }} />
                <Skeleton variant="text" width="75%" height={18} sx={{ mt: 1 }} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={120} height={32} />
                  <Skeleton variant="text" width="90%" height={22} sx={{ mt: 0.5 }} />
                </Box>
                <Skeleton variant="rounded" width={160} height={36} />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Skeleton variant="text" width={180} height={32} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="100%" height={22} />
              <Skeleton variant="text" width="96%" height={22} sx={{ mt: 0.5 }} />
              <Skeleton variant="text" width="88%" height={22} sx={{ mt: 0.5 }} />
            </Paper>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper elevation={0} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    fontSize: 24,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  }}
                >
                  {getInitials(firstName, lastName, email)}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {fullName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {email}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                    <Chip
                      label={role === 'admin' ? 'Administrator' : 'Member'}
                      size="small"
                      color={role === 'admin' ? 'secondary' : 'primary'}
                      variant="outlined"
                    />
                    <Chip label="Active" size="small" color="success" variant="outlined" />
                  </Box>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="First name" value={firstName || '—'} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="Last name" value={lastName || '—'} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="Email address" value={email} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow
                    label="Account role"
                    value={role === 'admin' ? 'Administrator' : 'Standard user'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="Member since" value={formatDate(account?.createdAt)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow label="Last updated" value={formatDate(account?.updatedAt)} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailRow
                    label="Account ID"
                    value={
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                      >
                        {account?._id ?? authUser?.id ?? '—'}
                      </Typography>
                    }
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Usage & activity
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow
                    label="Total reviews"
                    value={stats?.totalReviews?.toLocaleString() ?? '0'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow
                    label="Average review score"
                    value={stats ? `${stats.averageScore}/10` : '—'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow
                    label="Lifetime tokens used"
                    value={stats?.totalTokens?.toLocaleString() ?? account?.tokenUsage?.toLocaleString() ?? '0'}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DetailRow
                    label="Avg. response time"
                    value={
                      stats?.averageResponseTimeMs
                        ? `${Math.round(stats.averageResponseTimeMs / 1000)}s`
                        : '—'
                    }
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <DetailRow
                    label="Most reviewed language"
                    value={
                      stats?.topLanguages[0]
                        ? `${stats.topLanguages[0].language} (${stats.topLanguages[0].count} reviews)`
                        : '—'
                    }
                  />
                </Grid>
              </Grid>

              {stats && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Monthly token budget
                    </Typography>
                    <Typography variant="body2" color="primary.light">
                      {Math.round(percent)}% used
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={percent} sx={{ borderRadius: 1, height: 8 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {stats.monthlyUsed.toLocaleString()} of {stats.monthlyBudget.toLocaleString()} tokens used ·{' '}
                    {stats.monthlyRemaining.toLocaleString()} remaining
                  </Typography>
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Keep your account secure with a strong, unique password.
                  </Typography>
                </Box>
                <ChangePasswordForm />
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                About your account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your CodeReview AI account gives you access to AI-powered code analysis, review history,
                and token-based usage tracking. Reviews are saved to your history so you can revisit findings
                anytime. Token usage resets monthly on the 1st.
              </Typography>
            </Paper>
          </Box>
        )}
      </Container>
    </AppShell>
  );
}
