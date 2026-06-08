'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatarMenu } from '@/components/user-avatar-menu';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review' },
  { href: '/history', label: 'History' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <Toolbar disableGutters sx={{ position: 'relative', minHeight: 64, py: 0.5 }}>
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

            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: { xs: 'none', md: 'flex' },
                gap: 0.5,
              }}
            >
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

            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
              {mounted && user && <UserAvatarMenu />}
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
