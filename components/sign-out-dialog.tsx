'use client';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface SignOutDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SignOutDialog({ open, onClose, onConfirm }: SignOutDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Sign out</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to sign out? You will need to sign in again to access your reviews and dashboard.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" sx={{ textTransform: 'none' }}>
          Sign out
        </Button>
      </DialogActions>
    </Dialog>
  );
}
