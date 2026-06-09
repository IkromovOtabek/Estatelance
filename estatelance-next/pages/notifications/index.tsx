import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import {
  Bell,
  BellSlash,
  Briefcase,
  Chat,
  Heart,
  Megaphone,
  UserSquare,
  CheckCircle,
} from '@phosphor-icons/react';
import { GET_MY_NOTIFICATIONS, GET_UNREAD_NOTIFICATION_COUNT } from '../../apollo/user/query';
import { MARK_ALL_NOTIFICATIONS_READ } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Notification } from '../../libs/types';

// ─── Notification type icon & colour ─────────────────────────────────────────
function getNotifMeta(type: string) {
  const map: Record<string, { icon: React.ReactElement; color: string; bg: string }> = {
    BID:     { icon: <Briefcase  size={20} weight="fill" />, color: '#4f46e5', bg: '#eef2ff' },
    MESSAGE: { icon: <Chat       size={20} weight="fill" />, color: '#0891b2', bg: '#ecfeff' },
    FOLLOW:  { icon: <UserSquare size={20} weight="fill" />, color: '#16a34a', bg: '#f0fdf4' },
    LIKE:    { icon: <Heart      size={20} weight="fill" />, color: '#ef4444', bg: '#fef2f2' },
    SYSTEM:  { icon: <Megaphone  size={20} weight="fill" />, color: '#d97706', bg: '#fffbeb' },
  };
  return map[type] ?? { icon: <Bell size={20} />, color: '#64748b', bg: '#f8fafc' };
}

// ─── Route to follow on click ─────────────────────────────────────────────────
function getNotifRoute(
  type: string,
  relatedItemId?: string,
  linkPath?: string,
): string | null {
  if (linkPath?.startsWith('/_admin')) return linkPath;
  if (!relatedItemId) return null;
  if (type === 'BID')     return `/jobs/${relatedItemId}`;
  if (type === 'MESSAGE') return `/messages?userId=${relatedItemId}`;
  if (type === 'FOLLOW')  return `/profile/${relatedItemId}`;
  if (type === 'LIKE')    return `/articles`;
  if (type === 'SYSTEM')  return `/jobs/${relatedItemId}`;
  return null;
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
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} kun oldin`;
  return `${Math.floor(d / 30)} oy oldin`;
}

const NotificationsPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  const { data, loading, refetch } = useQuery(GET_MY_NOTIFICATIONS, {
    skip: !user._id,
    fetchPolicy: 'cache-and-network',
  });

  const { data: countData, refetch: refetchCount } = useQuery(GET_UNREAD_NOTIFICATION_COUNT, {
    skip: !user._id,
    fetchPolicy: 'cache-and-network',
  });

  const [markAllRead, { loading: marking }] = useMutation(MARK_ALL_NOTIFICATIONS_READ);

  const notifications: Notification[] = data?.getMyNotifications ?? [];
  const unreadCount: number = countData?.getUnreadNotificationCount ?? 0;

  const handleMarkAll = async () => {
    await markAllRead();
    refetch();
    refetchCount();
  };

  const handleNotifClick = (n: Notification) => {
    const route = getNotifRoute(n.notificationType, n.relatedItemId, n.linkPath);
    if (route) router.push(route);
  };

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (user._id === undefined) return;
    if (!user._id) router.replace('/account');
  }, [user._id]);

  const unread = notifications.filter((n) => !n.isRead);
  const read   = notifications.filter((n) => n.isRead);

  return (
    <>
      <Head>
        <title>Bildirishnomalar | BuFu</title>
      </Head>

      <Box sx={{ maxWidth: 680, mx: 'auto', px: { xs: 2, sm: 3 }, py: { xs: 3, sm: 5 } }}>
        {/* ─── Page header ─── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            }}>
              <Bell size={22} color="white" weight="fill" />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize={20} color="#0f172a" lineHeight={1.2}>
                Bildirishnomalar
              </Typography>
              {unreadCount > 0 && (
                <Typography fontSize={12} color="#64748b">
                  {unreadCount} ta o&apos;qilmagan
                </Typography>
              )}
            </Box>
          </Stack>

          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<CheckCircle size={16} />}
              onClick={handleMarkAll}
              disabled={marking}
              sx={{
                borderColor: '#e2e8f0', color: '#64748b',
                fontSize: 12, borderRadius: 2, textTransform: 'none',
                '&:hover': { borderColor: '#4f46e5', color: '#4f46e5', bgcolor: '#eef2ff' },
              }}
            >
              Barchasini o&apos;qildi deb belgilash
            </Button>
          )}
        </Stack>

        {/* ─── Loading ─── */}
        {loading && (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={32} sx={{ color: '#4f46e5' }} />
          </Box>
        )}

        {/* ─── Empty state ─── */}
        {!loading && notifications.length === 0 && (
          <Box sx={{
            py: 10, textAlign: 'center',
            bgcolor: '#f8fafc', borderRadius: 3,
            border: '1px solid #e2e8f0',
          }}>
            <BellSlash size={48} color="#cbd5e1" />
            <Typography fontSize={15} fontWeight={600} color="#94a3b8" mt={2}>
              Hozircha bildirishnoma yo&apos;q
            </Typography>
            <Typography fontSize={13} color="#cbd5e1" mt={0.5}>
              Bid, xabar yoki follow bo&apos;lganda bu yerda ko&apos;rinadi
            </Typography>
          </Box>
        )}

        {/* ─── Unread ─── */}
        {unread.length > 0 && (
          <Box mb={3}>
            <Typography fontSize={11} fontWeight={700} color="#4f46e5" textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
              O&apos;qilmaganlar · {unread.length}
            </Typography>
            <Box sx={{ borderRadius: 3, border: '1px solid #c7d2fe', overflow: 'hidden', bgcolor: 'white' }}>
              {unread.map((n, idx) => {
                const meta = getNotifMeta(n.notificationType);
                const clickable = !!getNotifRoute(n.notificationType, n.relatedItemId, n.linkPath);
                return (
                  <Box
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    sx={{
                      px: 2.5, py: 2,
                      bgcolor: '#f8f7ff',
                      borderLeft: '3px solid #4f46e5',
                      borderBottom: idx < unread.length - 1 ? '1px solid #e8e5ff' : 'none',
                      cursor: clickable ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: clickable ? '#eef2ff' : '#f8f7ff' },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{
                        width: 40, height: 40, borderRadius: '50%',
                        bgcolor: meta.bg,
                        color: meta.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {meta.icon}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Typography fontSize={14} fontWeight={700} color="#0f172a" lineHeight={1.3}>
                            {n.title}
                          </Typography>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4f46e5', flexShrink: 0, mt: 0.6, ml: 1 }} />
                        </Stack>
                        <Typography fontSize={13} color="#3A3A48" mt={0.4} lineHeight={1.5}>
                          {n.description}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center" mt={0.75}>
                          <Typography fontSize={11} color="#94a3b8">{timeAgo(n.createdAt)}</Typography>
                          <Chip
                            label={n.notificationType}
                            size="small"
                            sx={{
                              height: 16, fontSize: 9, fontWeight: 700,
                              bgcolor: meta.bg, color: meta.color,
                              px: 0.25,
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ─── Read ─── */}
        {read.length > 0 && (
          <Box>
            {unread.length > 0 && (
              <Divider sx={{ mb: 2.5 }}>
                <Typography fontSize={11} color="#94a3b8" fontWeight={600} textTransform="uppercase" letterSpacing={0.8}>
                  O&apos;qilganlar · {read.length}
                </Typography>
              </Divider>
            )}
            <Box sx={{ borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden', bgcolor: 'white' }}>
              {read.map((n, idx) => {
                const meta = getNotifMeta(n.notificationType);
                const clickable = !!getNotifRoute(n.notificationType, n.relatedItemId, n.linkPath);
                return (
                  <Box
                    key={n._id}
                    onClick={() => handleNotifClick(n)}
                    sx={{
                      px: 2.5, py: 1.75,
                      borderLeft: '3px solid transparent',
                      borderBottom: idx < read.length - 1 ? '1px solid #f1f5f9' : 'none',
                      cursor: clickable ? 'pointer' : 'default',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: clickable ? '#f8fafc' : 'transparent' },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Box sx={{
                        width: 38, height: 38, borderRadius: '50%',
                        bgcolor: '#f1f5f9',
                        color: '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {meta.icon}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13} fontWeight={500} color="#64748b" lineHeight={1.3}>
                          {n.title}
                        </Typography>
                        <Typography fontSize={12} color="#94a3b8" mt={0.3} lineHeight={1.5}>
                          {n.description}
                        </Typography>
                        <Typography fontSize={11} color="#cbd5e1" mt={0.5}>{timeAgo(n.createdAt)}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
};

export default withLayoutBasic(NotificationsPage);
