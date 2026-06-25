'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { Toaster } from 'sonner';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    secondary: { main: '#8b5cf6' },
    background: { default: '#070b14', paper: 'rgba(15, 23, 42, 0.92)' },
    error: { main: '#f87171' },
    success: { main: '#34d399' },
    text: { primary: '#e8edf7', secondary: '#94a3b8' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', fullWidth: true, size: 'small' },
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        closeButton
        visibleToasts={3}
        theme="dark"
      />
      {children}
    </ThemeProvider>
  );
}
