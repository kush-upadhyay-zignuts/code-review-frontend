'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';
import { API_BASE } from '@/lib/api';
import { AuthLayout, AuthLink } from '@/components/ui/auth-layout';
import { PasswordField } from '@/components/ui/password-field';
import {
  hasErrors,
  validatePasswordPair,
  type RegisterFormErrors,
} from '@/lib/register-validation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { enqueueSnackbar } = useSnackbar();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');

    if (!token) {
      setServerError('Invalid reset link. Request a new one.');
      return;
    }

    const passwordErrors = validatePasswordPair(password, confirmPassword);
    setErrors(passwordErrors);
    if (hasErrors(passwordErrors)) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (!response.ok) {
        const text = await response.text();
        try {
          const parsed = JSON.parse(text) as { message?: string | string[] };
          const msg = parsed.message;
          setServerError(Array.isArray(msg) ? msg.join(', ') : msg ?? text);
        } catch {
          setServerError(text || 'Password reset failed');
        }
        return;
      }

      enqueueSnackbar('Password reset successful!', { variant: 'success' });
      router.push('/login?reset=1');
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Alert severity="error">
        Invalid or missing reset token.{' '}
        <AuthLink href="/forgot-password">Request a new link</AuthLink>
      </Alert>
    );
  }

  return (
    <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PasswordField
        label="New password"
        placeholder="Min 8 chars, mixed case + number"
        value={password}
        error={Boolean(errors.password)}
        helperText={errors.password}
        onChange={setPassword}
        autoComplete="new-password"
      />

      <PasswordField
        label="Confirm new password"
        placeholder="Re-enter your password"
        value={confirmPassword}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
      />

      {serverError && <Alert severity="error">{serverError}</Alert>}

      <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
        {loading ? 'Resetting…' : 'Reset password'}
      </Button>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Choose a new password for your account"
      footer={
        <>
          Back to <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <Suspense fallback={<Alert severity="info">Loading…</Alert>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
