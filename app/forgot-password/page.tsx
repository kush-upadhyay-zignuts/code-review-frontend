'use client';

import { FormEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';
import { API_BASE } from '@/lib/api';
import { AuthLayout, AuthLink } from '@/components/ui/auth-layout';

export default function ForgotPasswordPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const text = await response.text();
        setServerError(text || 'Failed to send reset email');
        return;
      }

      setSent(true);
      enqueueSnackbar('If the email exists, a reset link has been sent.', {
        variant: 'info',
      });
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Alert severity="success">
          If an account exists with that email, a password reset link has been sent. Check your
          inbox.
        </Alert>
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
