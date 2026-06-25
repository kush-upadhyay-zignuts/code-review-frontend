'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { API_BASE } from '@/lib/api';
import { AuthLayout, AuthLink } from '@/components/ui/auth-layout';

const RESEND_COOLDOWN_SEC = 60;

function formatCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseApiError(text: string, fallback: string): string {
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (typeof json.message === 'string') return json.message;
    if (Array.isArray(json.message)) return json.message.join(', ');
  } catch {
    if (text) return text;
  }
  return fallback;
}

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const validateEmail = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    return true;
  }, [email]);

  const sendResetEmail = useCallback(async (): Promise<boolean> => {
    setServerError('');
    setEmailError('');

    if (!validateEmail()) return false;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        setServerError(parseApiError(text, 'Failed to send reset email'));
        return false;
      }

      setSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
      enqueueSnackbar('If the email exists, a reset link has been sent.', {
        variant: 'info',
      });
      return true;
    } catch {
      setServerError('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [email, enqueueSnackbar, validateEmail]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendResetEmail();
  };

  const onResend = async () => {
    if (cooldown > 0 || loading) return;
    await sendResetEmail();
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      {sent ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Alert severity="success">
            If an account exists with that email, a password reset link has been sent. Check your
            inbox.
          </Alert>

          {cooldown > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              You can resend the email in {formatCooldown(cooldown)}
            </Typography>
          )}

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Button
            variant="outlined"
            size="large"
            fullWidth
            disabled={cooldown > 0 || loading}
            onClick={() => void onResend()}
          >
            {loading
              ? 'Sending…'
              : cooldown > 0
                ? `Resend in ${formatCooldown(cooldown)}`
                : 'Resend email'}
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={() => {
              setSent(false);
              setServerError('');
              setCooldown(0);
            }}
            sx={{ textTransform: 'none' }}
          >
            Use a different email
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={email}
            error={Boolean(emailError)}
            helperText={emailError}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            autoComplete="email"
          />

          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </Box>
      )}
    </AuthLayout>
  );
}
