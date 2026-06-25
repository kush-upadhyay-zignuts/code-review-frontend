'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { API_BASE } from '@/lib/api';
import { parseApiError } from '@/lib/parse-api-error';
import { toast } from '@/lib/toast';
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
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token.', 'reset-password-token');
    }
  }, [token]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token) {
      toast.error('Invalid reset link. Request a new one.', 'reset-password-error');
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
        toast.error(parseApiError(text, 'Password reset failed'), 'reset-password-error');
        return;
      }

      toast.success('Password reset successful!', 'reset-password-success');
      router.push('/login?reset=1');
    } catch {
      toast.error('Something went wrong. Please try again.', 'reset-password-error');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Typography variant="body2" color="text.secondary">
        Invalid or missing reset token.{' '}
        <AuthLink href="/forgot-password">Request a new link</AuthLink>
      </Typography>
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
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
