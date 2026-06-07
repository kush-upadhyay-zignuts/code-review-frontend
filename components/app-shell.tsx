'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuthStore } from '@/lib/auth-store';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/history', label: 'History' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayName =
    mounted && user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : mounted
        ? user?.email
        : '';

  const logout = () => {
    clearAuth();
    document.cookie = 'auth-token=; Max-Age=0; path=/';
    router.push('/login');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage:
          'radial-gradient(at 20% 20%, rgba(59,130,246,0.18) 0, transparent 45%), radial-gradient(at 80% 10%, rgba(139,92,246,0.16) 0, transparent 40%)',
      }}
    >
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(12px)' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ gap: 2, py: 0.5 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#fff',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                }}
              >
                CR
              </Box>
              <Typography variant="h6" color="text.primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                CodeReview AI
              </Typography>
            </Link>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, flex: 1 }}>
              {links.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Button
                    key={link.href}
                    component={Link}
                    href={link.href}
                    color={active ? 'primary' : 'inherit'}
                    variant={active ? 'contained' : 'text'}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    {link.label}
                  </Button>
                );
              })}
              {mounted && user?.role === 'admin' && (
                <Button
                  component={Link}
                  href="/admin"
                  color={pathname.startsWith('/admin') ? 'secondary' : 'inherit'}
                  variant={pathname.startsWith('/admin') ? 'contained' : 'text'}
                  size="small"
                  sx={{ textTransform: 'none' }}
                >
                  Admin
                </Button>
              )}
            </Box>

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              {mounted && (
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                  <Typography variant="body2" color="text.primary">
                    {displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
              )}
              <Button variant="outlined" size="small" onClick={logout} sx={{ textTransform: 'none' }}>
                Sign out
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Box component="main" sx={{ pb: 6 }}>
        {children}
      </Box>
    </Box>
  );
}
