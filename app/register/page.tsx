'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { API_BASE } from '@/lib/api';
import { parseApiError } from '@/lib/parse-api-error';
import { toast } from '@/lib/toast';
import { AuthLayout, AuthLink } from '@/components/ui/auth-layout';
import { PasswordField } from '@/components/ui/password-field';
import {
  hasErrors,
  validateRegisterForm,
  type RegisterFormErrors,
} from '@/lib/register-validation';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (field === 'password' || field === 'confirmPassword') {
        delete next.confirmPassword;
      }
      return next;
    });
  };

  const validateField = (field: keyof typeof form) => {
    const fieldErrors = validateRegisterForm(form);
    if (fieldErrors[field]) {
      setErrors((current) => ({ ...current, [field]: fieldErrors[field] }));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const validationErrors = validateRegisterForm(form);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const text = await response.text();
        toast.error(parseApiError(text, 'Registration failed'), 'register-error');
        return;
      }

      router.push('/login?registered=1');
    } catch {
      toast.error('Something went wrong. Please try again.', 'register-error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start reviewing code with AI-powered insights"
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <Box component="form" onSubmit={onSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <TextField
            label="First name"
            placeholder="Jane"
            value={form.firstName}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            onBlur={() => validateField('firstName')}
            autoComplete="given-name"
          />
          <TextField
            label="Last name"
            placeholder="Doe"
            value={form.lastName}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            onBlur={() => validateField('lastName')}
            autoComplete="family-name"
          />
        </Box>

        <TextField
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={form.email}
          error={Boolean(errors.email)}
          helperText={errors.email}
          onChange={(e) => update('email', e.target.value)}
          onBlur={() => validateField('email')}
          autoComplete="email"
        />

        <PasswordField
          label="Password"
          placeholder="Min 8 chars, mixed case + number"
          value={form.password}
          error={Boolean(errors.password)}
          helperText={errors.password}
          onChange={(v) => update('password', v)}
          onBlur={() => validateField('password')}
          autoComplete="new-password"
        />

        <PasswordField
          label="Confirm password"
          placeholder="Re-enter your password"
          value={form.confirmPassword}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
          onChange={(v) => update('confirmPassword', v)}
          onBlur={() => validateField('confirmPassword')}
          autoComplete="new-password"
        />

        <Button type="submit" variant="contained" size="large" disabled={loading} fullWidth>
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </Box>
    </AuthLayout>
  );
}
