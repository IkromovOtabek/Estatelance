import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Divider, Stack, Typography } from '@mui/material';
import { Lock, DeviceMobile, Envelope, MapPin } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';

const QUICK_LINKS = [
  { label: 'Bosh sahifa', href: '/' },
  { label: 'Frilanserlar', href: '/browse' },
  { label: 'Ish e\'lonlari', href: '/jobs' },
  { label: 'Maqolalar', href: '/articles' },
  { label: 'E\'lonlar', href: '/announcements' },
];

const CATEGORIES = [
  { label: 'Foto & Dron', href: '/browse?category=VISUALS' },
  { label: '3D Vizualizatsiya', href: '/browse?category=RENDERING' },
  { label: 'Interyer dizayn', href: '/browse?category=DESIGN' },
  { label: 'Yuridik & Kadastr', href: '/browse?category=LEGAL' },
  { label: 'SMM & Kontent', href: '/browse?category=MARKETING' },
  { label: 'IT & Dasturlash', href: '/browse?category=IT' },
];

const Footer = () => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  // Color tokens
  const bg       = isDark ? '#0f172a' : '#f8fafc';
  const border   = isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const heading  = isDark ? '#ffffff' : '#0f172a';
  const body     = isDark ? '#64748b' : '#64748b';
  const subtle   = isDark ? '#94a3b8' : '#3A3A48';
  const accent   = isDark ? '#818cf8' : '#6366f1';

  return (
    <Box component="footer" sx={{ bgcolor: bg, color: subtle, mt: 'auto', borderTop: `1px solid ${border}` }}>

      {/* ── Main footer content ── */}
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 3, lg: 4 }, pt: { xs: 5, md: 7 }, pb: 4 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr 1fr 1fr' },
          gap: { xs: 4, md: 5 },
        }}>

          {/* ── Brand column ── */}
          <Box>
            {/* Logo */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box sx={{
                width: 44, height: 44, borderRadius: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px rgba(99,102,241,0.4)',
              }}>
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="10" height="22" rx="2" fill="white"/>
                  <rect x="13" y="5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="13" y="13" width="7" height="4" rx="2" fill="white"/>
                  <rect x="13" y="22.5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="19" y="5" width="4" height="22" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="5" width="10" height="4.5" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="13" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize={20} lineHeight={1} letterSpacing={-0.5}>
                  <span style={{ color: accent }}>Bu</span><span style={{ color: heading }}>Fu</span>
                </Typography>
                <Typography fontSize={10} color={accent} fontWeight={700} textTransform="uppercase" letterSpacing={1}>
                  Build Future
                </Typography>
              </Box>
            </Stack>

            <Typography fontSize={13} lineHeight={1.8} color={body} maxWidth={280} mb={3}>
              O&apos;zbekistonda frilanserlar va mijozlarni bog&apos;laydigan platforma.
              Foto, dizayn, yuridik, IT va boshqa ko&apos;plab xizmatlar.
            </Typography>

            {/* Escrow badge */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{
              display: 'inline-flex',
              bgcolor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 2, px: 1.5, py: 0.75,
            }}>
              <Lock size={16} color="#22c55e" weight="fill" />
              <Box>
                <Typography fontSize={11} fontWeight={700} color="#22c55e">Escrow himoyalangan</Typography>
                <Typography fontSize={10} color="#64748b">To&apos;lovlar kafolatlanadi</Typography>
              </Box>
            </Stack>
          </Box>

          {/* ── Quick links ── */}
          <Box>
            <Typography
              fontSize={11} fontWeight={700} color={heading}
              textTransform="uppercase" letterSpacing={1} mb={2}
            >
              Sahifalar
            </Typography>
            <Stack spacing={1}>
              {QUICK_LINKS.map((l) => (
                <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                  <Typography
                    fontSize={13} color={body}
                    sx={{ '&:hover': { color: accent }, transition: 'color 0.15s', cursor: 'pointer' }}
                  >
                    {l.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Box>

          {/* ── Categories ── */}
          <Box>
            <Typography
              fontSize={11} fontWeight={700} color={heading}
              textTransform="uppercase" letterSpacing={1} mb={2}
            >
              Kategoriyalar
            </Typography>
            <Stack spacing={1}>
              {CATEGORIES.map((l) => (
                <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                  <Typography
                    fontSize={13} color={body}
                    sx={{ '&:hover': { color: accent }, transition: 'color 0.15s', cursor: 'pointer' }}
                  >
                    {l.label}
                  </Typography>
                </Link>
              ))}
            </Stack>
          </Box>

          {/* ── Contact & Cities ── */}
          <Box>
            <Typography
              fontSize={11} fontWeight={700} color={heading}
              textTransform="uppercase" letterSpacing={1} mb={2}
            >
              Aloqa
            </Typography>
            <Stack spacing={1.5} mb={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DeviceMobile size={18} color={subtle} />
                <Box>
                  <Typography fontSize={12} color={body}>Telegram</Typography>
                  <Typography fontSize={13} color={subtle}>@otabek_ikromovv</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Envelope size={18} color={subtle} />
                <Box>
                  <Typography fontSize={12} color={body}>Email</Typography>
                  <Typography fontSize={13} color={subtle}>otabekikromov32@gmail.com</Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <MapPin size={18} color={subtle} />
                <Box>
                  <Typography fontSize={12} color={body}>Joylashuv</Typography>
                  <Typography fontSize={13} color={subtle}>Toshkent, O&apos;zbekiston</Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ── Bottom bar ── */}
      <Divider sx={{ borderColor: border }} />
      <Box sx={{ maxWidth: 1280, mx: 'auto', px: { xs: 3, lg: 4 }, py: 2.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={1.5}
        >
          <Typography fontSize={12} color={body}>
            © 2026 BuFu — Build Future
          </Typography>
          <Stack direction="row" spacing={2.5}>
            {['Foydalanish shartlari', 'Maxfiylik siyosati', 'Yordam'].map((t) => (
              <Typography
                key={t} fontSize={12} color={body}
                sx={{ cursor: 'pointer', '&:hover': { color: accent }, transition: 'color 0.15s' }}
              >
                {t}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Footer;
