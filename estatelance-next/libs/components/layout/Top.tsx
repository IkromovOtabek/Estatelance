import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Bell as NotificationsNoneIcon,
  Bell as NotificationsIcon,
  Megaphone as CampaignIcon,
  Checks as DoneAllIcon,
  List as MenuIcon,
  X as CloseIcon,
  ShieldCheck,
  User as UserMenuIcon,
  Briefcase as JobsMenuIcon,
  SignOut as LogoutMenuIcon,
  Newspaper as NewsIcon,
  Heart as LikeIcon,
  Chat as ChatIcon,
  UserSquare as FollowIcon,
  Sun,
  Moon,
} from '@phosphor-icons/react';
import { userVar } from '../../../apollo/store';
import { logout } from '../../../libs/auth';
import { UserType } from '../../enums';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT, GET_UNREAD_MESSAGE_COUNT } from '../../../apollo/user/query';
import { GET_ACTIVE_ANNOUNCEMENTS } from '../../../apollo/admin/query';
import { MARK_ALL_NOTIFICATIONS_READ } from '../../../apollo/user/mutation';
import { Announcement, Notification } from '../../types';
import { AnnouncementType } from '../../enums';

const NAV_LINKS = [
  { label: 'Bosh sahifa', href: '/' },
  { label: 'Frilanserlar', href: '/browse' },
  { label: 'Ishlar', href: '/jobs' },
  { label: 'Maqolalar', href: '/articles' },
  { label: 'E\'lonlar', href: '/announcements' },
  { label: 'Xabarlar', href: '/messages' },
];

// ─── Notification type icons ──────────────────────────────────────────────────
function getNotifIcon(type: string) {
  const map: Record<string, React.ReactElement> = {
    BID: <JobsMenuIcon size={18} color="#4f46e5" />,
    MESSAGE: <ChatIcon size={18} color="#0891b2" />,
    FOLLOW: <FollowIcon size={18} color="#16a34a" />,
    LIKE: <LikeIcon size={18} color="#ef4444" weight="fill" />,
    SYSTEM: <CampaignIcon size={18} color="#d97706" />,
  };
  return map[type] ?? <NotificationsNoneIcon size={18} color="#64748b" />;
}

// ─── Time-ago helper (Uzbek) ──────────────────────────────────────────────────
function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  if (diff < 0) return 'hozirgina';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

function getInitials(name?: string, fallback?: string): string {
  const source = (name ?? '').trim() || (fallback ?? '').trim();
  if (!source) return '';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

// ─── Top Navigation Bar ───────────────────────────────────────────────────────
const Top = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const { theme: currentTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;
  const isDark = mounted && currentTheme === 'dark';
  const isAdmin = mounted && user.userType === UserType.ADMIN;

  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const { data: notifData, refetch: refetchNotifs } = useQuery(GET_MY_NOTIFICATIONS, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const { data: countData, refetch: refetchCount } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000,
  });

  const { data: annData } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
  });

  const { data: msgCountData } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
    skip: !isLoggedIn,
    fetchPolicy: 'cache-and-network',
    pollInterval: 10000,
  });

  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  const notifications: Notification[] = notifData?.getMyNotifications ?? [];
  const unreadCount: number = countData?.getUnreadNotificationCount ?? 0;
  const announcements: Announcement[] = annData?.getActiveAnnouncements ?? [];
  const unreadMsgCount: number = msgCountData?.getUnreadMessageCount ?? 0;

  const handleOpenNotif = (e: React.MouseEvent<HTMLButtonElement>) => {
    setNotifAnchor(e.currentTarget);
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    refetchNotifs();
    refetchCount();
  };

  const notifOpen = Boolean(notifAnchor);

  // ── Mobile Drawer content ─────────────────────────────────────────────────
  const mobileDrawer = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: isDark ? '#0f172a' : '#ffffff' }}>
      {/* Drawer header */}
      <Box sx={{
        px: 2.5, py: 2,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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
            <Typography fontWeight={800} fontSize={15} color="white" lineHeight={1} letterSpacing={-0.5}>BuFu</Typography>
            <Typography fontSize={9} color="rgba(255,255,255,0.7)" letterSpacing={0.8} textTransform="uppercase">
              Build Future
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'white', p: 0.5 }}>
          <CloseIcon size={20} />
        </IconButton>
      </Box>

      {/* User info (if logged in) */}
      {isLoggedIn && (
        <Box sx={{ px: 2.5, py: 2, bgcolor: isDark ? '#1e293b' : '#f8fafc', borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar
              src={user.profileImage || undefined}
              sx={{ width: 40, height: 40, bgcolor: '#4f46e5', fontSize: 16 }}
            >
              {getInitials(user.fullName, user.username)}
            </Avatar>
            <Box>
              {user.fullName && (
                <Typography fontSize={13} fontWeight={700} color="#0f172a" lineHeight={1.2}>{user.fullName}</Typography>
              )}
              <Typography fontSize={12} color="#94a3b8">@{user.username}</Typography>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Nav links */}
      <List sx={{ flex: 1, py: 1 }}>
        {NAV_LINKS.map((link) => {
          const isActive = router.pathname === link.href;
          const isMessages = link.href === '/messages';
          if (isMessages && !isLoggedIn) return null;
          const showBadge = isMessages && isLoggedIn && unreadMsgCount > 0;
          return (
            <ListItem key={link.href} disablePadding>
              <Link href={link.href} style={{ textDecoration: 'none', width: '100%' }}>
                <ListItemButton
                  sx={{
                    mx: 1, borderRadius: 2,
                    bgcolor: isActive ? (isDark ? 'rgba(129,140,248,0.15)' : '#eef2ff') : 'transparent',
                    color: isActive ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#cbd5e1' : '#374151'),
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
                    py: 1.2,
                  }}
                >
                  <ListItemText
                    primary={link.label}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 700 : 500 }}
                  />
                  {showBadge && (
                    <Box sx={{
                      bgcolor: '#ef4444', color: 'white',
                      fontSize: 10, fontWeight: 800,
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
                    </Box>
                  )}
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
        {isAdmin && (
          <ListItem disablePadding>
            <Link href="/_admin" style={{ textDecoration: 'none', width: '100%' }}>
              <ListItemButton sx={{ mx: 1, borderRadius: 2, '&:hover': { bgcolor: '#fef2f2' } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ShieldCheck size={16} color="#dc2626" weight="fill" />
                  <Typography fontSize={14} fontWeight={600} color="#dc2626">Admin Panel</Typography>
                </Stack>
              </ListItemButton>
            </Link>
          </ListItem>
        )}
      </List>

      {/* Bottom actions */}
      <Box sx={{ p: 2, borderTop: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
        {isLoggedIn ? (
          <Stack spacing={1}>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => { router.push(`/profile/${user._id}`); setMobileOpen(false); }}
              sx={{ borderColor: '#e2e8f0', color: '#374151', borderRadius: 2, justifyContent: 'flex-start', pl: 2 }}
            >
              Profilim
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleLogout}
              sx={{ borderColor: '#fecaca', color: '#dc2626', borderRadius: 2, justifyContent: 'flex-start', pl: 2 }}
            >
              Chiqish
            </Button>
          </Stack>
        ) : (
          <Link href="/account" style={{ textDecoration: 'none' }}>
            <Button
              fullWidth
              variant="contained"
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700 }}
            >
              Kirish / Ro&apos;yxatdan o&apos;tish
            </Button>
          </Link>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
          color: isDark ? '#f1f5f9' : '#0f172a',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, lg: 4 }, minHeight: { xs: 56, sm: 64 } }}>

          {/* ── Hamburger (mobile only) ── */}
          <IconButton
            onClick={() => setMobileOpen(true)}
            sx={{
              display: { xs: 'flex', lg: 'none' },
              mr: 1,
              color: isDark ? '#94a3b8' : '#374151',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: 2,
              width: 36, height: 36,
              '&:hover': { bgcolor: isDark ? '#1e293b' : '#f1f5f9' },
            }}
          >
            <MenuIcon size={20} />
          </IconButton>

          {/* ── Logo ── */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              {/* Icon */}
              <Box sx={{
                width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(99,102,241,0.4)',
              }}>
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="10" height="22" rx="2" fill="white"/>
                  <rect x="13" y="5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="13" y="13" width="7" height="4" rx="2" fill="white"/>
                  <rect x="13" y="22.5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="19" y="5" width="4" height="22" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="5" width="10" height="4.5" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="13" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </Box>
              {/* Wordmark */}
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1, letterSpacing: -0.5 }}>
                  <span style={{ color: isDark ? '#e0e7ff' : '#1e1b4b' }}>Bu</span><span style={{ color: isDark ? '#a5b4fc' : '#6366f1' }}>Fu</span>
                </Typography>
                <Typography sx={{ fontSize: 9, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Build Future
                </Typography>
              </Box>
              <Typography sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 800, fontSize: 17, letterSpacing: -0.5 }}>
                <span style={{ color: isDark ? '#e0e7ff' : '#1e1b4b' }}>Bu</span><span style={{ color: isDark ? '#a5b4fc' : '#6366f1' }}>Fu</span>
              </Typography>
            </Stack>
          </Link>

          {/* ── Desktop Nav Links ── */}
          <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', lg: 'flex' }, ml: 4 }}>
            {NAV_LINKS.map((link) => {
              const isActive = router.pathname === link.href;
              const isMessages = link.href === '/messages';
              if (isMessages && !isLoggedIn) return null;
              const showMsgBadge = isMessages && isLoggedIn && unreadMsgCount > 0;
              return (
                <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                  <Badge
                    badgeContent={showMsgBadge ? unreadMsgCount : 0}
                    max={99}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: '#ef4444', color: 'white',
                        fontSize: 9, fontWeight: 800,
                        minWidth: 16, height: 16, borderRadius: 8,
                        top: 4, right: 2,
                      },
                    }}
                  >
                    <Button size="small" sx={{
                      color: isActive ? (isDark ? '#a5b4fc' : '#4f46e5') : (isDark ? '#94a3b8' : '#64748b'),
                      bgcolor: isActive ? (isDark ? 'rgba(129,140,248,0.15)' : '#eef2ff') : 'transparent',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13, px: 1.5, borderRadius: 2,
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.07)' : '#f1f5f9', color: isDark ? '#f1f5f9' : '#0f172a' },
                      transition: 'all 0.15s',
                    }}>
                      {link.label}
                    </Button>
                  </Badge>
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/_admin" style={{ textDecoration: 'none' }}>
                <Button size="small" startIcon={<ShieldCheck size={14} weight="fill" />} sx={{
                  color: '#dc2626', border: '1px solid #fecaca',
                  px: 1.5, fontSize: 13, borderRadius: 2,
                  '&:hover': { bgcolor: '#fef2f2' },
                }}>
                  Admin Panel
                </Button>
              </Link>
            )}
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* ── Right side ── */}
          {isLoggedIn ? (
            <Stack direction="row" spacing={1} alignItems="center">

              {/* ── Dark/Light toggle ── */}
              <Tooltip title={isDark ? "Yorug' rejim" : "Qorong'i rejim"}>
                <IconButton
                  size="small"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  sx={{
                    color: isDark ? '#facc15' : '#64748b',
                    bgcolor: isDark ? 'rgba(250,204,21,0.1)' : 'rgba(100,116,139,0.08)',
                    '&:hover': { bgcolor: isDark ? 'rgba(250,204,21,0.2)' : 'rgba(100,116,139,0.15)' },
                    width: 34, height: 34,
                  }}
                >
                  {isDark ? <Sun size={18} weight="fill" /> : <Moon size={18} />}
                </IconButton>
              </Tooltip>

              {/* ── Bell Icon ── */}
              <Tooltip title="Bildirishnomalar">
                <IconButton
                  ref={bellRef}
                  size="small"
                  onClick={handleOpenNotif}
                  sx={{
                    position: 'relative',
                    overflow: 'visible',
                    color: notifOpen ? '#4f46e5' : unreadCount > 0 ? '#4f46e5' : '#64748b',
                    bgcolor: notifOpen ? '#eef2ff' : unreadCount > 0 ? '#eef2ff' : 'transparent',
                    border: '1px solid',
                    borderColor: notifOpen ? '#c7d2fe' : unreadCount > 0 ? '#c7d2fe' : (isDark ? '#334155' : '#e2e8f0'),
                    borderRadius: 2,
                    width: 36, height: 36,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: isDark ? '#1e293b' : '#f1f5f9', color: isDark ? '#a5b4fc' : '#4f46e5', borderColor: '#c7d2fe' },
                  }}
                >
                  <NotificationsNoneIcon
                    size={18}
                    color={notifOpen || unreadCount > 0 ? '#4f46e5' : '#64748b'}
                  />
                  {unreadCount > 0 && (
                    <Box
                      component="span"
                      sx={{
                        '@keyframes notifPulse': {
                          '0%, 100%': { transform: 'scale(1)' },
                          '50%': { transform: 'scale(1.12)' },
                        },
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        minWidth: 18,
                        height: 18,
                        px: 0.45,
                        borderRadius: 9,
                        bgcolor: '#ef4444',
                        color: 'white',
                        border: '2px solid #fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 800,
                        lineHeight: 1,
                        animation: 'notifPulse 2s ease-in-out infinite',
                        pointerEvents: 'none',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Box>
                  )}
                </IconButton>
              </Tooltip>

              {/* ── Notification Popover ── */}
              <Popover
                open={notifOpen}
                anchorEl={notifAnchor}
                onClose={() => setNotifAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    width: 380, maxHeight: '80vh',
                    borderRadius: 3,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden', mt: 1,
                  },
                }}
              >
                {/* Panel Header */}
                <Box sx={{
                  px: 2.5, py: 1.75,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <NotificationsIcon weight="fill" color="white" size={18} />
                    <Typography fontWeight={700} fontSize={14} color="white">Bildirishnomalar</Typography>
                    {unreadCount > 0 && (
                      <Box sx={{
                        bgcolor: '#ef4444', color: 'white',
                        fontSize: 10, fontWeight: 800,
                        px: 0.75, py: 0.1, borderRadius: 10, lineHeight: 1.8,
                      }}>
                        {unreadCount} yangi
                      </Box>
                    )}
                  </Stack>
                  {unreadCount > 0 && (
                    <Tooltip title="Barchasini o'qildi deb belgilash">
                      <IconButton size="small" onClick={handleMarkAllRead} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: 'white' } }}>
                        <DoneAllIcon size={20} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Scrollable content */}
                <Box sx={{ overflowY: 'auto', maxHeight: 'calc(80vh - 56px)' }}>
                  {notifications.length === 0 && announcements.length === 0 ? (
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                        <NotificationsNoneIcon size={40} color="#94a3b8" />
                      </Box>
                      <Typography fontSize={13} color="text.secondary">Hozircha bildirishnoma yo&apos;q</Typography>
                    </Box>
                  ) : (
                    <>
                      {notifications.length > 0 && (
                        <Box>
                          {notifications.slice(0, 15).map((n, idx) => (
                            <Box
                              key={n._id}
                              sx={{
                                px: 2.5, py: 1.75,
                                bgcolor: n.isRead ? 'transparent' : '#f8f7ff',
                                borderLeft: n.isRead ? '3px solid transparent' : '3px solid #4f46e5',
                                borderBottom: idx < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                                transition: 'background 0.2s',
                                '&:hover': { bgcolor: '#f8fafc' },
                              }}
                            >
                              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                <Box sx={{
                                  width: 36, height: 36, borderRadius: '50%',
                                  bgcolor: n.isRead ? '#f1f5f9' : '#eef2ff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {getNotifIcon(n.notificationType)}
                                </Box>
                                <Box flex={1} minWidth={0}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography
                                      fontSize={13} fontWeight={n.isRead ? 500 : 700}
                                      color={n.isRead ? '#475569' : '#0f172a'} noWrap
                                    >
                                      {n.title}
                                    </Typography>
                                    {!n.isRead && (
                                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4f46e5', flexShrink: 0, ml: 1 }} />
                                    )}
                                  </Stack>
                                  <Typography fontSize={12} color="#64748b" sx={{
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5,
                                  }}>
                                    {n.description}
                                  </Typography>
                                  <Typography fontSize={11} color="#94a3b8" mt={0.25}>{timeAgo(n.createdAt)}</Typography>
                                </Box>
                              </Stack>
                            </Box>
                          ))}
                        </Box>
                      )}

                      {announcements.length > 0 && (
                        <Box>
                          <Box sx={{ px: 2.5, py: 1, bgcolor: '#fffbeb', borderTop: notifications.length > 0 ? '1px solid #e2e8f0' : 'none', borderBottom: '1px solid #fde68a' }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <CampaignIcon size={14} color="#d97706" />
                              <Typography fontSize={11} fontWeight={700} color="#d97706" textTransform="uppercase" letterSpacing={0.5}>
                                E&apos;lonlar va Reklamalar
                              </Typography>
                            </Stack>
                          </Box>
                          {announcements.map((ann, idx) => {
                            const isAd = ann.announcementType === AnnouncementType.ADVERTISEMENT;
                            return (
                              <Box key={ann._id} sx={{
                                px: 2.5, py: 1.75,
                                borderBottom: idx < announcements.length - 1 ? '1px solid #f1f5f9' : 'none',
                                '&:hover': { bgcolor: '#fffbeb' },
                              }}>
                                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                  <Box sx={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    bgcolor: isAd ? '#fef3c7' : '#eef2ff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0,
                                  }}>
                                    {isAd
                                      ? <CampaignIcon size={18} color="#d97706" />
                                      : <NewsIcon size={18} color="#4f46e5" />}
                                  </Box>
                                  <Box flex={1} minWidth={0}>
                                    <Stack direction="row" spacing={0.75} alignItems="center" mb={0.25}>
                                      <Chip
                                        label={isAd ? 'Reklama' : 'Yangilik'}
                                        size="small"
                                        sx={{
                                          height: 16, fontSize: 9, fontWeight: 700, px: 0.5,
                                          bgcolor: isAd ? '#fef3c7' : '#eef2ff',
                                          color: isAd ? '#d97706' : '#4f46e5',
                                        }}
                                      />
                                      <Typography fontSize={11} color="#94a3b8">{timeAgo(ann.createdAt)}</Typography>
                                    </Stack>
                                    <Typography fontSize={13} fontWeight={600} color="#0f172a" noWrap>{ann.title}</Typography>
                                    <Typography fontSize={12} color="#64748b" sx={{
                                      display: '-webkit-box', WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5,
                                    }}>
                                      {ann.body}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </>
                  )}
                </Box>

                {/* Footer */}
                <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #f1f5f9', bgcolor: '#fafafa', display: 'flex', gap: 1 }}>
                  <Button
                    size="small" fullWidth
                    onClick={() => { setNotifAnchor(null); router.push('/notifications'); }}
                    sx={{ fontSize: 12, color: '#4f46e5', textTransform: 'none' }}
                  >
                    Barcha bildirishnomalarni ko&apos;rish →
                  </Button>
                  <Button
                    size="small" fullWidth
                    onClick={() => { setNotifAnchor(null); router.push('/announcements'); }}
                    sx={{ fontSize: 12, color: '#64748b', textTransform: 'none' }}
                  >
                    E&apos;lonlar →
                  </Button>
                </Box>
              </Popover>

              {/* ── Profile Avatar ── */}
              <Tooltip title={user.fullName ?? user.username ?? 'Profil'}>
                <Avatar
                  src={user.profileImage || undefined}
                  sx={{
                    width: 36, height: 36, cursor: 'pointer',
                    bgcolor: '#4f46e5', fontSize: 14,
                    border: '2px solid #e0e7ff',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#4f46e5', transform: 'scale(1.05)' },
                  }}
                  onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                >
                  {getInitials(user.fullName, user.username)}
                </Avatar>
              </Tooltip>

              <Menu
                anchorEl={profileMenuAnchor}
                open={!!profileMenuAnchor}
                onClose={() => setProfileMenuAnchor(null)}
                PaperProps={{
                  sx: {
                    minWidth: 200, mt: 1,
                    borderRadius: 2.5,
                    boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
                    border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
                  {user.fullName && (
                    <Typography fontSize={13} fontWeight={700} color="#0f172a">{user.fullName}</Typography>
                  )}
                  <Typography fontSize={12} color="text.secondary">@{user.username}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { router.push(`/profile/${user._id}`); setProfileMenuAnchor(null); }} sx={{ fontSize: 13, py: 1.2, gap: 1.25 }}>
                  <UserMenuIcon size={16} color="#64748b" /> Mening profilim
                </MenuItem>
                <MenuItem onClick={() => { router.push('/my-works'); setProfileMenuAnchor(null); }} sx={{ fontSize: 13, py: 1.2, gap: 1.25 }}>
                  <JobsMenuIcon size={16} color="#64748b" /> Mening ishlarim
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout} sx={{ fontSize: 13, color: '#dc2626', py: 1.2, gap: 1.25 }}>
                  <LogoutMenuIcon size={16} color="#dc2626" /> Chiqish
                </MenuItem>
              </Menu>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Dark/Light toggle (guest) */}
              <Tooltip title={isDark ? "Yorug' rejim" : "Qorong'i rejim"}>
                <IconButton
                  size="small"
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  sx={{
                    color: isDark ? '#facc15' : '#64748b',
                    bgcolor: isDark ? 'rgba(250,204,21,0.1)' : 'rgba(100,116,139,0.08)',
                    '&:hover': { bgcolor: isDark ? 'rgba(250,204,21,0.2)' : 'rgba(100,116,139,0.15)' },
                    width: 34, height: 34,
                  }}
                >
                  {isDark ? <Sun size={18} weight="fill" /> : <Moon size={18} />}
                </IconButton>
              </Tooltip>
              <Link href="/account" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca', transform: 'translateY(-1px)' },
                    fontSize: 13, fontWeight: 700, borderRadius: 2,
                    px: 2.5, py: 0.75,
                    boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
                    transition: 'all 0.2s',
                  }}
                >
                  Kirish
                </Button>
              </Link>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { lg: 'none' } }}
        PaperProps={{
          sx: {
            width: 280,
            border: 'none',
            boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
          },
        }}
      >
        {mobileDrawer}
      </Drawer>
    </>
  );
};

export default Top;
