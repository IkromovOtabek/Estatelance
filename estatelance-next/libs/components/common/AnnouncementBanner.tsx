import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { X as CloseIcon, Megaphone as CampaignIcon, ArrowSquareOut as OpenInNewIcon, Newspaper } from '@phosphor-icons/react';
import { GET_ACTIVE_ANNOUNCEMENTS } from '../../../apollo/admin/query';
import { userVar } from '../../../apollo/store';
import { Announcement } from '../../types';
import { AnnouncementType } from '../../enums';
import { useRouter } from 'next/router';

const MODAL_DELAY_MS   = 5000;
const FLOAT_INTERVAL_MS = 15 * 60 * 1000;
const AUTO_DISMISS_MS  = 30000; // float card auto-dismisses after 30s
const SESSION_KEY      = 'ann_modal_shown_v2';

export default function AnnouncementBanner() {
  const router = useRouter();
  const user   = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  const [modalOpen,  setModalOpen]  = useState(false);
  const [floatOpen,  setFloatOpen]  = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress,   setProgress]   = useState(100); // countdown bar: 100→0

  const floatIntervalRef = useRef<ReturnType<typeof setInterval>  | null>(null);
  const modalTimerRef    = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const dismissTimerRef  = useRef<ReturnType<typeof setTimeout>   | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
  });

  const announcements: Announcement[] = data?.getActiveAnnouncements ?? [];

  // ── Modal: show 5s after login (once per session) ─────────────────────────
  useEffect(() => {
    if (!isLoggedIn || announcements.length === 0) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    modalTimerRef.current = setTimeout(() => {
      setModalOpen(true);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, MODAL_DELAY_MS);

    return () => { if (modalTimerRef.current) clearTimeout(modalTimerRef.current); };
  }, [isLoggedIn, announcements.length]);

  // ── Float card: every 15 minutes ──────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn || announcements.length === 0) return;

    floatIntervalRef.current = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % announcements.length);
      showFloatCard();
    }, FLOAT_INTERVAL_MS);

    return () => { if (floatIntervalRef.current) clearInterval(floatIntervalRef.current); };
  }, [isLoggedIn, announcements.length]);

  const showFloatCard = () => {
    setFloatOpen(true);
    setProgress(100);

    // Auto-dismiss after 30s with animated countdown
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(progressIntervalRef.current!);
      }
    }, 200);

    dismissTimerRef.current = setTimeout(() => {
      setFloatOpen(false);
    }, AUTO_DISMISS_MS);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    // Show float card 3 seconds after modal closes
    setTimeout(() => {
      if (announcements.length > 0) {
        setCurrentIdx(0);
        showFloatCard();
      }
    }, 3000);
  };

  const handleCloseFloat = () => {
    setFloatOpen(false);
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  if (!isLoggedIn || announcements.length === 0) return null;

  const floatAnn = announcements[currentIdx % announcements.length];
  const isAd     = floatAnn?.announcementType === AnnouncementType.ADVERTISEMENT;

  // Gradient colours per type
  const adGradient   = 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)';
  const newsGradient = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
  const gradient     = isAd ? adGradient : newsGradient;

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════
          MODAL — shown once, 5 seconds after login
      ════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' } }}
      >
        {/* Gradient header */}
        <Box sx={{
          background: newsGradient,
          px: 3, py: 2.5,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CampaignIcon size={20} color="white" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={16} color="white" lineHeight={1}>
                Platform Announcements
              </Typography>
              <Typography fontSize={12} color="rgba(255,255,255,0.75)">
                {announcements.length} active {announcements.length === 1 ? 'announcement' : 'announcements'}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={handleCloseModal} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {announcements.map((ann, idx) => {
            const annIsAd = ann.announcementType === AnnouncementType.ADVERTISEMENT;
            return (
              <Box key={ann._id} sx={{ p: 3, borderBottom: idx < announcements.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                {ann.imageUrl && (
                  <Box component="img" src={ann.imageUrl} alt={ann.title}
                    sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                    onError={(e: any) => { e.target.style.display = 'none'; }} />
                )}
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Chip
                    icon={annIsAd ? <CampaignIcon size={10} /> : <Newspaper size={10} />}
                    label={annIsAd ? 'Advertisement' : 'Announcement'}
                    size="small"
                    sx={{
                      fontWeight: 700, fontSize: 10,
                      bgcolor: annIsAd ? '#fef3c7' : '#eef2ff',
                      color: annIsAd ? '#d97706' : '#4f46e5',
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                  {ann.createdAt && (
                    <Typography fontSize={11} color="#94a3b8">
                      {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  )}
                </Stack>
                <Typography fontWeight={800} fontSize={17} mb={1} color="#0f172a">{ann.title}</Typography>
                <Typography fontSize={13} color="#64748b" lineHeight={1.7} sx={{ whiteSpace: 'pre-line' }}>
                  {ann.body.slice(0, 300)}{ann.body.length > 300 ? '...' : ''}
                </Typography>
              </Box>
            );
          })}
        </DialogContent>

        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button size="small" onClick={() => { handleCloseModal(); router.push('/announcements'); }}
            sx={{ fontSize: 12, color: '#4f46e5' }}>
            View all →
          </Button>
          <Button variant="contained" onClick={handleCloseModal}
            sx={{ background: newsGradient, fontWeight: 700, px: 3, borderRadius: 2, '&:hover': { opacity: 0.9 } }}>
            Tushunarli
          </Button>
        </Box>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING CARD — bottom-right, eye-catching design
      ════════════════════════════════════════════════════════════════ */}
      {floatOpen && floatAnn && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 340,
            zIndex: 1500,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: isAd
              ? '0 0 0 2px #f59e0b, 0 20px 60px rgba(245,158,11,0.35), 0 8px 24px rgba(0,0,0,0.15)'
              : '0 0 0 2px #4f46e5, 0 20px 60px rgba(79,70,229,0.30), 0 8px 24px rgba(0,0,0,0.15)',
            // Slide-up + glow entrance animation
            animation: 'floatSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            '@keyframes floatSlideIn': {
              from: { opacity: 0, transform: 'translateY(40px) scale(0.92)' },
              to:   { opacity: 1, transform: 'translateY(0) scale(1)' },
            },
            // Subtle pulsing glow to catch attention
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: -2,
              borderRadius: 'inherit',
              background: gradient,
              zIndex: -1,
              opacity: 0.6,
              animation: 'glowPulse 2.5s ease-in-out infinite',
              '@keyframes glowPulse': {
                '0%, 100%': { opacity: 0.4, transform: 'scale(1)' },
                '50%':       { opacity: 0.8, transform: 'scale(1.01)' },
              },
            },
          }}
        >
          {/* Gradient header strip */}
          <Box sx={{ background: gradient, px: 2, py: 1.5, position: 'relative' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Bouncing icon */}
                <Box sx={{
                  display: 'flex',
                  animation: 'bounce 1s ease-in-out infinite',
                  '@keyframes bounce': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%':       { transform: 'translateY(-4px)' },
                  },
                }}>
                  {isAd
                    ? <CampaignIcon size={20} color="white" weight="fill" />
                    : <Newspaper size={20} color="white" weight="fill" />}
                </Box>
                <Box>
                  <Typography fontSize={12} fontWeight={800} color="white" lineHeight={1}>
                    {isAd ? 'Advertisement' : 'New Announcement'}
                  </Typography>
                  <Typography fontSize={10} color="rgba(255,255,255,0.8)">
                    From BuFu
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={0.25} alignItems="center">
                {/* "NEW" badge */}
                <Box sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontSize: 9,
                  fontWeight: 900,
                  px: 0.75,
                  py: 0.2,
                  borderRadius: 1,
                  letterSpacing: 0.5,
                  mr: 0.5,
                }}>
                  NEW
                </Box>
                <IconButton size="small" onClick={handleCloseFloat}
                  sx={{ color: 'rgba(255,255,255,0.8)', p: 0.4, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <CloseIcon size={16} />
                </IconButton>
              </Stack>
            </Stack>

            {/* Countdown progress bar */}
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: 2,
                bgcolor: 'rgba(255,255,255,0.25)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'rgba(255,255,255,0.85)',
                  transition: 'transform 0.2s linear',
                },
              }}
            />
          </Box>

          {/* Card body */}
          <Box sx={{ bgcolor: 'white' }}>
            {/* Image */}
            {floatAnn.imageUrl && (
              <Box component="img" src={floatAnn.imageUrl} alt={floatAnn.title}
                sx={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }}
                onError={(e: any) => { e.target.style.display = 'none'; }} />
            )}

            <Box sx={{ p: 2 }}>
              {/* Title */}
              <Typography fontWeight={800} fontSize={15} color="#0f172a" mb={0.75} lineHeight={1.3}>
                {floatAnn.title}
              </Typography>

              {/* Body */}
              <Typography fontSize={12} color="#64748b" lineHeight={1.6} sx={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {floatAnn.body}
              </Typography>

              {/* Footer */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1.75}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {/* Dots for multiple announcements */}
                  {announcements.length > 1 && announcements.map((_, i) => (
                    <Box key={i} sx={{
                      width: i === currentIdx % announcements.length ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: i === currentIdx % announcements.length
                        ? (isAd ? '#f59e0b' : '#4f46e5')
                        : '#e2e8f0',
                      transition: 'all 0.3s',
                    }} />
                  ))}
                </Stack>

                <Button
                  size="small"
                  endIcon={<OpenInNewIcon size={12} />}
                  onClick={() => { handleCloseFloat(); router.push('/announcements'); }}
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: isAd ? '#d97706' : '#4f46e5',
                    px: 1.5, py: 0.5,
                    bgcolor: isAd ? '#fffbeb' : '#eef2ff',
                    borderRadius: 2,
                    '&:hover': { bgcolor: isAd ? '#fef3c7' : '#e0e7ff' },
                  }}
                >
                  Read More
                </Button>
              </Stack>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
}
