'use client';

import { FormEvent, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { apiFetch } from '@/lib/api';
import { parseApiError } from '@/lib/parse-api-error';
import { toast } from '@/lib/toast';
import { PasswordField } from '@/components/ui/password-field';
import {
  hasErrors,
  validatePasswordPair,
  type RegisterFormErrors,
} from '@/lib/register-validation';

function resetFormState() {
  return {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    errors: {} as RegisterFormErrors,
  };
}

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);

  const closeModal = () => {
    setOpen(false);
    const cleared = resetFormState();
    setCurrentPassword(cleared.currentPassword);
    setNewPassword(cleared.newPassword);
    setConfirmPassword(cleared.confirmPassword);
    setErrors(cleared.errors);
  };

  const handleClose = () => {
    if (loading) return;
    closeModal();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!currentPassword) {
      toast.error('Current password is required', 'change-password-current');
      return;
    }

    const passwordErrors = validatePasswordPair(newPassword, confirmPassword);
    setErrors(passwordErrors);
    if (hasErrors(passwordErrors)) return;

    setLoading(true);
    try {
      await apiFetch<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      toast.success('Password changed successfully.', 'change-password-success');
      closeModal();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to change password';
      toast.error(parseApiError(message, message), 'change-password-error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)} sx={{ textTransform: 'none' }}>
        Change password
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>Change password</DialogTitle>
        <Box component="form" onSubmit={onSubmit} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your current password, then choose a new one. You will stay signed in on this device.
            </Typography>

            <PasswordField
              label="Current password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />

            <PasswordField
              label="New password"
              placeholder="Min 8 chars, mixed case + number"
              value={newPassword}
              error={Boolean(errors.password)}
              helperText={errors.password}
              onChange={setNewPassword}
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm new password"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: 'none' }}>
              {loading ? 'Updating…' : 'Update password'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
