'use client';

import Link from '@mui/material/Link';
import NextLink from 'next/link';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { ReactNode } from 'react';

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        py: 6,
        background:
          'radial-gradient(at 20% 20%, rgba(59,130,246,0.18) 0, transparent 45%), radial-gradient(at 80% 10%, rgba(139,92,246,0.16) 0, transparent 40%), #070b14',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              mx: 'auto',
              mb: 2,
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20,
              color: '#fff',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
            }}
          >
            CR
          </Box>
          <Typography variant="h4" color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        </Box>
        <Paper elevation={0} sx={{ p: 4 }}>
          {children}
        </Paper>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
          {footer}
        </Typography>
      </Box>
    </Box>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link component={NextLink} href={href} underline="hover" color="primary">
      {children}
    </Link>
  );
}
