import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Box, Button, Dialog, DialogContent, Stack, Typography,
} from '@mui/material';
import { LockSimple } from '@phosphor-icons/react';

/** Global auth modal — istalgan joydan `bufu-auth-required` eventi bilan ochiladi */
export default function AuthRequiredModal() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('bufu-auth-required', handler);
    return () => window.removeEventListener('bufu-auth-required', handler);
  }, []);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
          bgcolor: isDark ? '#16161F' : '#fff',
          border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
          boxShadow: isDark
            ? '0 24px 60px rgba(0,0,0,0.5)'
            : '0 24px 60px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 4, px: 3 }}>
        {/* Icon */}
        <Box sx={{
          width: 56, height: 56, borderRadius: '50%', mx: 'auto', mb: 2.5,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
        }}>
          <LockSimple size={26} weight="fill" color="white" />
        </Box>

        <Typography fontWeight={800} fontSize={20} mb={1}
          color={isDark ? '#F4F4F5' : '#0F172A'}>
          Tizimga kiring
        </Typography>
        <Typography fontSize={14} color={isDark ? '#94A3B8' : '#64748B'}
          mb={3.5} lineHeight={1.6}>
          Ishlarni sevimlilarga saqlash uchun avval tizimga kiring yoki hisob yarating
        </Typography>

        <Stack spacing={1.5}>
          <Link href="/account" style={{ textDecoration: 'none' }}
            onClick={() => setOpen(false)}>
            <Button fullWidth variant="contained" sx={{
              bgcolor: '#6366F1', '&:hover': { bgcolor: '#4338ca' },
              fontWeight: 700, fontSize: 14, borderRadius: 2, py: 1.25,
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}>
              Kirish
            </Button>
          </Link>
          <Link href="/account?tab=register" style={{ textDecoration: 'none' }}
            onClick={() => setOpen(false)}>
            <Button fullWidth variant="outlined" sx={{
              borderColor: isDark ? '#27272F' : '#e2e8f0',
              color: isDark ? '#CBD5E1' : '#374151',
              fontWeight: 600, fontSize: 14, borderRadius: 2, py: 1.25,
              '&:hover': { borderColor: '#6366F1', color: '#6366F1', bgcolor: 'rgba(99,102,241,0.05)' },
            }}>
              Ro&apos;yxatdan o&apos;tish
            </Button>
          </Link>
        </Stack>

        <Button size="small" onClick={() => setOpen(false)}
          sx={{ mt: 2, color: isDark ? '#64748B' : '#94A3B8', fontSize: 12 }}>
          Keyinroq
        </Button>
      </DialogContent>
    </Dialog>
  );
}
