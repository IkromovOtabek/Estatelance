import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  Plus as AddIcon,
  SignOut as LogoutIcon,
  ShieldCheck,
  ChartBar,
  Users,
  Briefcase,
  Newspaper,
  Megaphone,
  Bell,
  House,
  ClipboardText,
  LockOpen,
  ProhibitInset,
  CurrencyDollar,
  Heart,
  Eye,
  PersonSimple,
  Broadcast,
  Trash,
} from '@phosphor-icons/react';
import {
  ADMIN_GET_ALL_USERS,
  ADMIN_GET_ALL_JOBS,
  ADMIN_GET_ALL_POSTS,
  ADMIN_GET_ALL_ANNOUNCEMENTS,
  ADMIN_GET_DASHBOARD_STATS,
  ADMIN_GET_VISITOR_STATS,
} from '../../apollo/admin/query';
import {
  ADMIN_CHANGE_USER_STATUS,
  ADMIN_CHANGE_USER_ROLE,
  ADMIN_DELETE_USER,
  ADMIN_DELETE_JOB,
  ADMIN_DELETE_POST,
  ADMIN_CREATE_ANNOUNCEMENT,
  ADMIN_TOGGLE_ANNOUNCEMENT,
  ADMIN_DELETE_ANNOUNCEMENT,
  ADMIN_SEND_NOTIFICATION,
  ADMIN_SEND_BROADCAST,
} from '../../apollo/admin/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { logout } from '../../libs/auth';
import { User, Job, Post, Announcement, DashboardStats, DailyVisitorStat } from '../../libs/types';
import { UserType, UserStatus, AnnouncementType } from '../../libs/enums';

// ─── Color helpers ─────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a',
  SPAM: '#f59e0b',
  DELETED: '#dc2626',
};

const JOB_STATUS_COLOR: Record<string, string> = {
  OPEN: '#4f46e5',
  ACTIVE: '#0891b2',
  COMPLETED: '#16a34a',
  CANCELLED: '#dc2626',
};

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const isAdmin = user.userType === UserType.ADMIN;

  // Tabs: 0=Stats, 1=Users, 2=Jobs, 3=Posts, 4=Announcements, 5=Notifications
  const [activeTab, setActiveTab] = useState(0);
  const [userFilterTab, setUserFilterTab] = useState(0);

  // Alert messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Delete user dialog ─────────────────────────────────────────────────────
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });

  // ── Spam dialog ────────────────────────────────────────────────────────────
  const [spamDialog, setSpamDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });
  const [spamReason, setSpamReason] = useState('');

  // ── Announcement dialog ────────────────────────────────────────────────────
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annType, setAnnType] = useState<AnnouncementType>(AnnouncementType.ANNOUNCEMENT);

  // ── Notification dialog ────────────────────────────────────────────────────
  const [notifDialog, setNotifDialog] = useState<{ open: boolean; userId: string; username: string; broadcast: boolean }>({
    open: false, userId: '', username: '', broadcast: false,
  });
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(ADMIN_GET_ALL_USERS, {
    variables: { page: 1, limit: 100 },
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
  });

  const { data: jobsData, loading: jobsLoading, refetch: refetchJobs } = useQuery(ADMIN_GET_ALL_JOBS, {
    variables: { page: 1, limit: 100 },
    skip: !isAdmin || activeTab !== 2,
    fetchPolicy: 'cache-and-network',
  });

  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = useQuery(ADMIN_GET_ALL_POSTS, {
    variables: { page: 1, limit: 100 },
    skip: !isAdmin || activeTab !== 3,
    fetchPolicy: 'cache-and-network',
  });

  const { data: annData, loading: annLoading, refetch: refetchAnn } = useQuery(ADMIN_GET_ALL_ANNOUNCEMENTS, {
    skip: !isAdmin || activeTab !== 4,
    fetchPolicy: 'cache-and-network',
  });

  const { data: statsData, loading: statsLoading } = useQuery(ADMIN_GET_DASHBOARD_STATS, {
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
  });

  const { data: visitorData } = useQuery(ADMIN_GET_VISITOR_STATS, {
    variables: { days: 14 },
    skip: !isAdmin || activeTab !== 0,
    fetchPolicy: 'cache-and-network',
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [changeStatus] = useMutation(ADMIN_CHANGE_USER_STATUS);
  const [changeRole] = useMutation(ADMIN_CHANGE_USER_ROLE);
  const [deleteUser] = useMutation(ADMIN_DELETE_USER);
  const [deleteJob] = useMutation(ADMIN_DELETE_JOB);
  const [deletePost] = useMutation(ADMIN_DELETE_POST);
  const [createAnnouncement] = useMutation(ADMIN_CREATE_ANNOUNCEMENT);
  const [toggleAnnouncement] = useMutation(ADMIN_TOGGLE_ANNOUNCEMENT);
  const [deleteAnnouncement] = useMutation(ADMIN_DELETE_ANNOUNCEMENT);
  const [sendNotification] = useMutation(ADMIN_SEND_NOTIFICATION);
  const [sendBroadcast] = useMutation(ADMIN_SEND_BROADCAST);

  // ── Data ───────────────────────────────────────────────────────────────────
  const allUsers: User[] = usersData?.adminGetAllUsers ?? [];
  const allJobs: Job[] = jobsData?.adminGetAllJobs ?? [];
  const allPosts: Post[] = postsData?.adminGetAllPosts ?? [];
  const visitorStats: DailyVisitorStat[] = visitorData?.adminGetVisitorStats ?? [];
  const allAnn: Announcement[] = annData?.adminGetAllAnnouncements ?? [];
  const stats: DashboardStats | null = statsData?.adminGetDashboardStats ?? null;

  const userTabs = [
    allUsers,
    allUsers.filter((u) => u.userType === UserType.AGENT),
    allUsers.filter((u) => u.userType === UserType.FREELANCER),
    allUsers.filter((u) => u.userStatus === UserStatus.SPAM),
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(''); }
    else { setSuccessMsg(msg); setErrorMsg(''); }
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 4000);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  // When admin picks SPAM from dropdown → open reason dialog first
  const handleStatusChange = (userId: string, username: string, newStatus: UserStatus) => {
    if (newStatus === UserStatus.SPAM) {
      setSpamReason('');
      setSpamDialog({ open: true, userId, username });
    } else {
      confirmStatusChange(userId, newStatus, '');
    }
  };

  const confirmStatusChange = async (userId: string, newStatus: UserStatus, reason: string) => {
    try {
      await changeStatus({
        variables: { input: { userId, newStatus, spamReason: reason || undefined } },
      });
      notify(`User status updated to ${newStatus}.`);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to update status', true);
    }
    setSpamDialog({ open: false, userId: '', username: '' });
  };

  const handleChangeRole = async (userId: string, role: UserType) => {
    try {
      await changeRole({ variables: { input: { userId, newRole: role } } });
      notify('Role updated.');
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to update role', true);
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    setDeleteDialog({ open: true, userId, username: name });
  };

  const confirmDeleteUser = async () => {
    const { userId, username } = deleteDialog;
    try {
      await deleteUser({ variables: { userId } });
      notify(`User "@${username}" deleted.`);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to delete', true);
    }
    setDeleteDialog({ open: false, userId: '', username: '' });
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!window.confirm(`Delete job "${title}"?`)) return;
    try {
      await deleteJob({ variables: { jobId } });
      notify('Job deleted.');
      refetchJobs();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to delete job', true);
    }
  };

  const handleDeletePost = async (postId: string, title: string) => {
    if (!window.confirm(`Delete post "${title}"?`)) return;
    try {
      await deletePost({ variables: { postId } });
      notify('Post deleted.');
      refetchPosts();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to delete post', true);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      notify('Title and body are required.', true);
      return;
    }
    try {
      await createAnnouncement({
        variables: {
          input: {
            title: annTitle.trim(),
            body: annBody.trim(),
            imageUrl: annImageUrl.trim() || undefined,
            announcementType: annType,
          },
        },
      });
      notify('Announcement created and sent to all users!');
      setAnnouncementDialog(false);
      setAnnTitle(''); setAnnBody(''); setAnnImageUrl('');
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to create', true);
    }
  };

  const handleToggleAnn = async (id: string) => {
    try {
      await toggleAnnouncement({ variables: { announcementId: id } });
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed', true);
    }
  };

  const handleDeleteAnn = async (id: string, title: string) => {
    if (!window.confirm(`Delete announcement "${title}"?`)) return;
    try {
      await deleteAnnouncement({ variables: { announcementId: id } });
      notify('Announcement deleted.');
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed', true);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      notify('Title and message are required.', true);
      return;
    }
    try {
      if (notifDialog.broadcast) {
        await sendBroadcast({ variables: { title: notifTitle, description: notifBody } });
        notify('Broadcast sent to all users!');
      } else {
        await sendNotification({
          variables: { userId: notifDialog.userId, title: notifTitle, description: notifBody },
        });
        notify(`Notification sent to @${notifDialog.username}`);
      }
      setNotifDialog({ open: false, userId: '', username: '', broadcast: false });
      setNotifTitle(''); setNotifBody('');
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Failed to send', true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ShieldCheck size={48} color="#dc2626" weight="fill" />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>Access Denied</Typography>
        <Typography color="text.secondary" fontSize={14} mb={3}>
          This page is only accessible to administrators.
        </Typography>
        <Link href="/_admin/login" style={{ textDecoration: 'none' }}>
          <Button variant="contained" sx={{ bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' } }}>
            Admin Login
          </Button>
        </Link>
      </Box>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Admin Panel — BuFu</title></Head>

      {/* Header row */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ShieldCheck size={24} color="#4f46e5" weight="fill" />
            <Box>
              <Typography variant="h5" fontWeight={800} lineHeight={1}>Admin Panel</Typography>
              <Typography color="text.secondary" fontSize={12}>Welcome, @{user.username}</Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon size={20} />}
            onClick={() => { setActiveTab(5); setNotifDialog({ open: false, userId: '', username: '', broadcast: true }); }}
            sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#64748b' }}
          >
            Broadcast
          </Button>
          <Button
            size="small"
            color="error"
            variant="outlined"
            startIcon={<LogoutIcon size={20} />}
            onClick={handleLogout}
            sx={{ fontSize: 12 }}
          >
            Log Out
          </Button>
        </Stack>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

      {/* Main Tabs */}
      <Box sx={{ borderBottom: '1px solid #e2e8f0', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            '& .MuiTab-root': { fontSize: 13, textTransform: 'none', minWidth: 100 },
            '& .Mui-selected': { color: '#4f46e5', fontWeight: 700 },
            '& .MuiTabs-indicator': { bgcolor: '#4f46e5' },
          }}
        >
          <Tab icon={<ChartBar size={15} />} iconPosition="start" label="Stats" />
          <Tab icon={<Users size={15} />} iconPosition="start" label={`Users (${allUsers.length})`} />
          <Tab icon={<Briefcase size={15} />} iconPosition="start" label={`Jobs (${stats?.totalJobs ?? allJobs.length})`} />
          <Tab icon={<Newspaper size={15} />} iconPosition="start" label={`Posts (${stats?.totalPosts ?? allPosts.length})`} />
          <Tab icon={<Megaphone size={15} />} iconPosition="start" label="Announcements" />
          <Tab icon={<Bell size={15} />} iconPosition="start" label="Notifications" />
        </Tabs>
      </Box>

      {/* ── TAB 0: Stats ────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Box>
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#4f46e5' }} />
            </Box>
          ) : stats ? (
            <>
              <Typography fontWeight={700} mb={2} color="#64748b" fontSize={13} textTransform="uppercase" letterSpacing={1}>
                Platform Overview
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2, mb: 4 }}>
                {[
                  { label: 'Total Users', value: stats.totalUsers, color: '#4f46e5', icon: <Users size={20} color="#4f46e5" weight="fill" /> },
                  { label: 'Agents', value: stats.totalAgents, color: '#0891b2', icon: <House size={20} color="#0891b2" weight="fill" /> },
                  { label: 'Freelancers', value: stats.totalFreelancers, color: '#16a34a', icon: <Briefcase size={20} color="#16a34a" weight="fill" /> },
                  { label: 'Total Jobs', value: stats.totalJobs, color: '#7c3aed', icon: <ClipboardText size={20} color="#7c3aed" weight="fill" /> },
                  { label: 'Open Jobs', value: stats.activeJobs, color: '#d97706', icon: <LockOpen size={20} color="#d97706" weight="fill" /> },
                  { label: 'Total Posts', value: stats.totalPosts, color: '#0891b2', icon: <Newspaper size={20} color="#0891b2" weight="fill" /> },
                  { label: 'Announcements', value: stats.totalAnnouncements, color: '#16a34a', icon: <Megaphone size={20} color="#16a34a" weight="fill" /> },
                  { label: 'Spammed Users', value: stats.spammedUsers, color: '#dc2626', icon: <ProhibitInset size={20} color="#dc2626" weight="fill" /> },
                  {
                    label: 'Budget Posted',
                    value: `$${Number(stats.totalBudgetPosted ?? 0).toLocaleString()}`,
                    color: '#059669',
                    icon: <CurrencyDollar size={20} color="#059669" weight="fill" />,
                  },
                ].map((s) => (
                  <Box
                    key={s.label}
                    sx={{
                      p: 2.5,
                      bgcolor: 'white',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
                    }}
                  >
                    <Box sx={{ display: 'flex', mb: 0.75 }}>{s.icon}</Box>
                    <Typography fontSize={26} fontWeight={900} color={s.color} lineHeight={1}>
                      {s.value}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary" mt={0.5}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ mb: 3 }} />
              <Typography fontWeight={700} mb={2} color="#64748b" fontSize={13} textTransform="uppercase" letterSpacing={1}>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  variant="contained"
                  startIcon={<Megaphone size={16} />}
                  onClick={() => { setActiveTab(4); setAnnouncementDialog(true); }}
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontSize: 13 }}
                >
                  New Announcement
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Bell size={16} />}
                  onClick={() => setNotifDialog({ open: true, userId: '', username: '', broadcast: true })}
                  sx={{ fontSize: 13, borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  Broadcast Notification
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Users size={16} />}
                  onClick={() => setActiveTab(1)}
                  sx={{ fontSize: 13, borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  Manage Users
                </Button>
              </Stack>
            </>
          ) : (
            <Typography color="text.secondary">No stats available.</Typography>
          )}

          {/* ── Visitor Stats ── */}
          {visitorStats.length > 0 && (
            <Box mt={4}>
              <Typography fontWeight={700} fontSize={15} mb={2} color="#0f172a">
                📊 Kunlik tashrif buyuruvchilar (so'nggi 14 kun)
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Sana</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: '#4f46e5' }}>Tashriflar</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: '#0891b2' }}>Unikal</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>Ro'yxatdan o'tdi</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: 12, color: '#d97706' }}>Login bo'ldi</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {visitorStats.map((s) => (
                      <TableRow key={s.date} hover>
                        <TableCell sx={{ fontSize: 12, fontFamily: 'monospace' }}>{s.date}</TableCell>
                        <TableCell align="center">
                          <Chip label={s.visits} size="small" sx={{ bgcolor: '#ede9fe', color: '#4f46e5', fontWeight: 700, fontSize: 11 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={s.uniqueVisitors} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0891b2', fontWeight: 700, fontSize: 11 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={s.registrations} size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: 11 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={s.logins} size="small" sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700, fontSize: 11 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* ── TAB 1: Users ────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Box>
          {/* Sub-tabs for user filter */}
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            {['All', 'Agents', 'Freelancers', 'Spam'].map((label, i) => (
              <Button
                key={label}
                size="small"
                variant={userFilterTab === i ? 'contained' : 'outlined'}
                onClick={() => setUserFilterTab(i)}
                sx={{
                  fontSize: 12,
                  bgcolor: userFilterTab === i ? '#4f46e5' : 'transparent',
                  borderColor: '#e2e8f0',
                  color: userFilterTab === i ? 'white' : '#64748b',
                  '&:hover': { bgcolor: userFilterTab === i ? '#4338ca' : '#f1f5f9' },
                }}
              >
                {label} ({userTabs[i].length})
              </Button>
            ))}
          </Stack>

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#4f46e5' }} />
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: '#64748b', borderBottom: '2px solid #e2e8f0' } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Spam Reason</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userTabs[userFilterTab].map((u, idx) => (
                    <TableRow key={u._id} hover sx={{ '& td': { fontSize: 13, py: 1.5 } }}>
                      <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Link href={`/profile/${u._id}`} style={{ textDecoration: 'none' }}>
                          <Typography fontSize={13} fontWeight={600} color="#4f46e5">
                            @{u.username}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell sx={{ color: '#475569' }}>{u.fullName ?? '—'}</TableCell>

                      {/* Role */}
                      <TableCell>
                        {u.userType === UserType.ADMIN ? (
                          <Chip label="ADMIN" size="small" sx={{ bgcolor: '#1e1b4b', color: 'white', fontSize: 10 }} />
                        ) : (
                          <Select
                            value={u.userType}
                            size="small"
                            onChange={(e) => handleChangeRole(u._id, e.target.value as UserType)}
                            sx={{ fontSize: 12, height: 28 }}
                          >
                            <MenuItem value={UserType.AGENT} sx={{ fontSize: 12 }}>Agent</MenuItem>
                            <MenuItem value={UserType.FREELANCER} sx={{ fontSize: 12 }}>Freelancer</MenuItem>
                          </Select>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        {u.userType === UserType.ADMIN ? (
                          <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontSize: 10 }} />
                        ) : (
                          <Select
                            value={u.userStatus}
                            size="small"
                            onChange={(e) => handleStatusChange(u._id, u.username, e.target.value as UserStatus)}
                            sx={{ fontSize: 12, height: 28, color: STATUS_COLOR[u.userStatus] }}
                          >
                            <MenuItem value={UserStatus.ACTIVE} sx={{ fontSize: 12, color: '#16a34a' }}>Active</MenuItem>
                            <MenuItem value={UserStatus.SPAM} sx={{ fontSize: 12, color: '#f59e0b' }}>Spam</MenuItem>
                          </Select>
                        )}
                      </TableCell>

                      {/* Spam reason */}
                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography fontSize={11} color="#94a3b8" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.spamReason || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {u.createdAt ? new Date(Number(u.createdAt)).toISOString().slice(0, 10) : '—'}
                      </TableCell>

                      {/* Action buttons */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          {u.userType !== UserType.ADMIN && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => setNotifDialog({ open: true, userId: u._id, username: u.username, broadcast: false })}
                                sx={{ fontSize: 10, py: 0.25, px: 0.75, borderColor: '#e2e8f0', color: '#4f46e5' }}
                              >
                                Notify
                              </Button>
                              <Tooltip title="Delete user">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(u._id, u.username)}
                              >
                                <Trash size={16} weight="bold" />
                              </IconButton>
                            </Tooltip>
                            </>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {userTabs[userFilterTab].length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
                        No users in this category.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      {/* ── TAB 2: Jobs ─────────────────────────────────────────────────── */}
      {activeTab === 2 && (
        <Box>
          {jobsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#4f46e5' }} /></Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: '#64748b', borderBottom: '2px solid #e2e8f0' } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Budget</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Bids</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allJobs.map((j, idx) => (
                    <TableRow key={j._id} hover sx={{ '& td': { fontSize: 13, py: 1.5 } }}>
                      <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Link href={`/jobs/${j._id}`} style={{ textDecoration: 'none' }}>
                          <Typography fontSize={13} fontWeight={600} color="#4f46e5" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {j.title}
                          </Typography>
                        </Link>
                      </TableCell>
                      <TableCell><Chip label={j.category} size="small" sx={{ fontSize: 10 }} /></TableCell>
                      <TableCell>
                        <Chip label={j.status} size="small"
                          sx={{ bgcolor: `${JOB_STATUS_COLOR[j.status]}22`, color: JOB_STATUS_COLOR[j.status], fontSize: 10, fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>${j.budget}</TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{j.agentName ?? '—'}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{j.bidCount}</TableCell>
                      <TableCell sx={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{j.createdAt?.slice(0, 10) ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete job">
                          <IconButton size="small" color="error" onClick={() => handleDeleteJob(j._id, j.title)}>
                            <Trash size={16} weight="bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allJobs.length === 0 && (
                    <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>No jobs found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      {/* ── TAB 3: Posts ────────────────────────────────────────────────── */}
      {activeTab === 3 && (
        <Box>
          {postsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#4f46e5' }} /></Box>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, fontSize: 12, color: '#64748b', borderBottom: '2px solid #e2e8f0' } }}>
                    <TableCell>#</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Author</TableCell>
                    <TableCell>Likes</TableCell>
                    <TableCell>Views</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allPosts.map((p, idx) => (
                    <TableRow key={p._id} hover sx={{ '& td': { fontSize: 13, py: 1.5 } }}>
                      <TableCell sx={{ color: '#94a3b8' }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography fontSize={13} fontWeight={600} sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: '#64748b' }}>{p.authorName}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Heart size={13} color="#ef4444" weight="fill" />
                          <span>{p.likeCount}</span>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Eye size={13} color="#94a3b8" />
                          <span>{p.viewCount}</span>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{p.createdAt?.slice(0, 10) ?? '—'}</TableCell>
                      <TableCell>
                        <Tooltip title="Delete post">
                          <IconButton size="small" color="error" onClick={() => handleDeletePost(p._id, p.title)}>
                            <Trash size={16} weight="bold" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allPosts.length === 0 && (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>No posts found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      )}

      {/* ── TAB 4: Announcements ─────────────────────────────────────────── */}
      {activeTab === 4 && (
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography fontWeight={700} fontSize={15}>Site-wide Announcements</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setAnnouncementDialog(true)}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontSize: 12 }}
            >
              New Announcement
            </Button>
          </Stack>

          {annLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#4f46e5' }} /></Box>
          ) : (
            <Stack spacing={2}>
              {allAnn.map((a) => (
                <Box
                  key={a._id}
                  sx={{
                    p: 2.5,
                    bgcolor: 'white',
                    borderRadius: 2,
                    border: `1px solid ${a.isActive ? '#e2e8f0' : '#fef3c7'}`,
                    opacity: a.isActive ? 1 : 0.6,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Chip
                          label={a.announcementType}
                          size="small"
                          sx={{
                            fontSize: 10, fontWeight: 700,
                            bgcolor: a.announcementType === AnnouncementType.ADVERTISEMENT ? '#fef3c7' : '#eef2ff',
                            color: a.announcementType === AnnouncementType.ADVERTISEMENT ? '#d97706' : '#4f46e5',
                          }}
                        />
                        <Chip
                          label={a.isActive ? 'Active' : 'Hidden'}
                          size="small"
                          sx={{
                            fontSize: 10,
                            bgcolor: a.isActive ? '#dcfce7' : '#f1f5f9',
                            color: a.isActive ? '#16a34a' : '#94a3b8',
                          }}
                        />
                        <Typography fontSize={11} color="#94a3b8">
                          {a.createdAt?.slice(0, 10)}
                        </Typography>
                      </Stack>
                      <Typography fontWeight={700} fontSize={14} mb={0.5}>{a.title}</Typography>
                      <Typography fontSize={13} color="#64748b" sx={{ whiteSpace: 'pre-line' }}>
                        {a.body.slice(0, 200)}{a.body.length > 200 ? '...' : ''}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1} ml={2} flexShrink={0}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleToggleAnn(a._id)}
                        sx={{ fontSize: 11, py: 0.25, px: 1, borderColor: '#e2e8f0', color: '#64748b' }}
                      >
                        {a.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleDeleteAnn(a._id, a.title)}
                        sx={{ fontSize: 11, py: 0.25, px: 1 }}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              ))}

              {allAnn.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                    <Megaphone size={40} color="#94a3b8" />
                  </Box>
                  <Typography>No announcements yet. Create the first one!</Typography>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      )}

      {/* ── TAB 5: Notifications ─────────────────────────────────────────── */}
      {activeTab === 5 && (
        <Box>
          <Typography fontWeight={700} fontSize={15} mb={1}>Send Notifications</Typography>
          <Typography fontSize={13} color="text.secondary" mb={3}>
            Send a custom notification to a specific user or broadcast to all active users.
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Broadcast size={16} />}
              onClick={() => setNotifDialog({ open: true, userId: '', username: '', broadcast: true })}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontSize: 13 }}
            >
              Broadcast to All Users
            </Button>
            <Button
              variant="outlined"
              startIcon={<Users size={16} />}
              onClick={() => setActiveTab(1)}
              sx={{ fontSize: 13, borderColor: '#e2e8f0', color: '#64748b' }}
            >
              Go to Users → click "Notify"
            </Button>
          </Stack>
        </Box>
      )}

      {/* ── Dialog: Delete User ─────────────────────────────────────────── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: '', username: '' })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Trash size={20} color="#dc2626" weight="fill" />
            <span>Delete User</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={14}>
            <strong>@{deleteDialog.username}</strong> foydalanuvchisini o'chirishni tasdiqlaysizmi?
          </Typography>
          <Typography fontSize={13} color="text.secondary" mt={1}>
            Bu amalni ortga qaytarib bo'lmaydi. Foydalanuvchi va uning barcha ma'lumotlari databasedan o'chiriladi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, userId: '', username: '' })} sx={{ color: '#64748b' }}>
            Bekor qilish
          </Button>
          <Button variant="contained" color="error" onClick={confirmDeleteUser} startIcon={<Trash size={16} weight="bold" />}>
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Spam Reason ──────────────────────────────────────────── */}
      <Dialog open={spamDialog.open} onClose={() => setSpamDialog({ open: false, userId: '', username: '' })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ProhibitInset size={20} color="#f59e0b" weight="fill" />
            <span>Spam User: @{spamDialog.username}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            This user will be notified with the reason below. Their account will be restricted.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Spam Reason"
            placeholder="e.g. Posting fake job listings. Repeated violations of platform rules."
            value={spamReason}
            onChange={(e) => setSpamReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSpamDialog({ open: false, userId: '', username: '' })} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => confirmStatusChange(spamDialog.userId, UserStatus.SPAM, spamReason)}
          >
            Confirm Spam
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Create Announcement ──────────────────────────────────── */}
      <Dialog open={announcementDialog} onClose={() => setAnnouncementDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Megaphone size={20} color="#4f46e5" weight="fill" />
            <span>New Announcement</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            This will be sent as a notification to all active users on the platform.
          </Typography>
          <Stack spacing={2} mt={1}>
            <ToggleButtonGroup
              value={annType}
              exclusive
              onChange={(_, v) => v && setAnnType(v)}
              size="small"
            >
              <ToggleButton value={AnnouncementType.ANNOUNCEMENT} sx={{ fontSize: 12, gap: 0.75 }}>
                <Newspaper size={15} /> Announcement
              </ToggleButton>
              <ToggleButton value={AnnouncementType.ADVERTISEMENT} sx={{ fontSize: 12, gap: 0.75 }}>
                <Megaphone size={15} /> Advertisement
              </ToggleButton>
            </ToggleButtonGroup>

            <TextField
              fullWidth size="small" label="Title"
              placeholder="e.g. Platform Maintenance Notice"
              value={annTitle}
              onChange={(e) => setAnnTitle(e.target.value)}
            />
            <TextField
              fullWidth multiline rows={4} label="Body"
              placeholder="Full announcement text..."
              value={annBody}
              onChange={(e) => setAnnBody(e.target.value)}
            />
            <TextField
              fullWidth size="small" label="Image URL (optional)"
              placeholder="https://..."
              value={annImageUrl}
              onChange={(e) => setAnnImageUrl(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAnnouncementDialog(false)} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateAnnouncement} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
            Publish & Notify Users
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog: Send Notification ────────────────────────────────────── */}
      <Dialog open={notifDialog.open} onClose={() => setNotifDialog({ open: false, userId: '', username: '', broadcast: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {notifDialog.broadcast ? <Broadcast size={20} color="#4f46e5" weight="fill" /> : <Bell size={20} color="#4f46e5" weight="fill" />}
            <span>{notifDialog.broadcast ? 'Broadcast Notification' : `Notify @${notifDialog.username}`}</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography fontSize={13} color="text.secondary" mb={2}>
            {notifDialog.broadcast
              ? 'This message will be sent to all active users.'
              : `A notification will appear in @${notifDialog.username}'s notification bell.`}
          </Typography>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth size="small" label="Title"
              placeholder="e.g. Important update"
              value={notifTitle}
              onChange={(e) => setNotifTitle(e.target.value)}
            />
            <TextField
              fullWidth multiline rows={3} label="Message"
              placeholder="Full notification text..."
              value={notifBody}
              onChange={(e) => setNotifBody(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotifDialog({ open: false, userId: '', username: '', broadcast: false })} sx={{ color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSendNotification} sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}>
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default withLayoutBasic(AdminPage);
