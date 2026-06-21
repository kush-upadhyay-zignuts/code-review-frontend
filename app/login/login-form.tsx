'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSnackbar } from 'notistack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { useAuthStore } from '@/lib/auth-store';
import { API_BASE } from '@/lib/api';
import { AuthLayout, AuthLink } from '@/components/ui/auth-layout';
import { PasswordField } from '@/components/ui/password-field';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      enqueueSnackbar('Registration completed successfully! Please sign in.', {
        variant: 'success',
      });
    }
    if (searchParams.get('reset') === '1') {
      enqueueSnackbar('Password reset successful. You can now sign in.', {
        variant: 'success',
      });
    }
  }, [searchParams, enqueueSnackbar]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    setEmailError('');
    setPasswordError('');

    let valid = true;
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      valid = false;
    }
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setServerError('Invalid email or password');
        return;
      }

      const data = (await response.json()) as {
        accessToken: string;
        user: {
          id: string;
          firstName?: string;
          lastName?: string;
          email: string;
          role: 'user' | 'admin';
          tokenUsage: number;
        };
      };

      setAuth(data.accessToken, data.user);
      document.cookie = `auth-token=${data.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      enqueueSnackbar('You are logged in successfully!', { variant: 'success' });
      router.push('/dashboard');
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your code reviews"
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/register">Create one</AuthLink>
        </>
      }
    >
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

        <PasswordField
          label="Password"
          placeholder="Enter your password"
          value={password}
          error={Boolean(passwordError)}
          helperText={passwordError}
          onChange={(v) => {
            setPassword(v);
            setPasswordError('');
          }}
          autoComplete="current-password"
        />

        {/* <Box sx={{ textAlign: 'right', mt: -1 }}>
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </Box> */}

        {serverError && <Alert severity="error">{serverError}</Alert>}

        <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
