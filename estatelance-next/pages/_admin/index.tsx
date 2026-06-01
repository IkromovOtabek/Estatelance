import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  ADMIN_GET_ALL_USERS,
  ADMIN_GET_ALL_JOBS,
  ADMIN_GET_ALL_POSTS,
  ADMIN_GET_ALL_ANNOUNCEMENTS,
  ADMIN_GET_DASHBOARD_STATS,
  ADMIN_GET_VISITOR_STATS,
  ADMIN_GET_DAILY_USER_DETAILS,
  ADMIN_GET_TODAY_SESSIONS,
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
import { userVar } from '../../apollo/store';
import { logout } from '../../libs/auth';
import {
  User,
  Job,
  Post,
  Announcement,
  DashboardStats,
  DailyVisitorStat,
  VisitorSessionItem,
} from '../../libs/types';
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

// ─── Sidebar nav items ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Boshqaruv paneli', icon: 'dashboard' },
  { id: 'users', label: 'Foydalanuvchilar', icon: 'group' },
  { id: 'jobs', label: 'Ish e\'lonlari', icon: 'work' },
  { id: 'payments', label: 'To\'lovlar', icon: 'payments' },
  { id: 'posts', label: 'Maqolalar', icon: 'article' },
  { id: 'announcements', label: 'E\'lonlar', icon: 'campaign' },
  { id: 'settings', label: 'Sozlamalar', icon: 'settings' },
];

// ─── Sidebar Component ─────────────────────────────────────────────────────────
const Sidebar = ({
  activeSection,
  onNav,
  onLogout,
  username,
  isDark,
}: {
  activeSection: string;
  onNav: (id: string) => void;
  onLogout: () => void;
  username: string;
  isDark: boolean;
}) => (
  <aside
    className="h-screen w-64 fixed left-0 top-0 flex flex-col z-50 shadow-sm"
    style={{
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderRight: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
    }}
  >
    {/* Logo */}
    <div className="px-6 py-6" style={{ borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
      <span className="text-2xl font-black text-indigo-500 tracking-tight">BuFu</span>
      <p className="text-xs mt-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Admin Panel</p>
    </div>

    {/* Nav */}
    <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
            style={isActive ? {
              backgroundColor: '#4f46e5',
              color: '#ffffff',
            } : {
              color: isDark ? '#94a3b8' : '#64748b',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = isDark ? '#1e293b' : '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = isDark ? '#e2e8f0' : '#1e293b'; } }}
            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLElement).style.color = isDark ? '#94a3b8' : '#64748b'; } }}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>

    {/* User info + logout */}
    <div className="px-3 pb-4 pt-4" style={{ borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` }}>
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2"
        style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {username?.[0]?.toUpperCase() ?? 'A'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>@{username}</p>
          <p className="text-xs" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Bosh administrator</p>
        </div>
      </div>
      <Link
        href="/"
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors mb-1"
        style={{ color: isDark ? '#94a3b8' : '#64748b' }}
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span>Bosh sahifaga</span>
      </Link>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">logout</span>
        <span>Chiqish</span>
      </button>
    </div>
  </aside>
);

// ─── Stats Card ────────────────────────────────────────────────────────────────
const StatCard = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  badge,
  badgeColor,
  onClick,
}: {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}) => {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{
        backgroundColor: dark ? '#0f172a' : '#ffffff',
        border: `1px solid ${dark ? '#1e293b' : '#e2e8f0'}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <span className={`material-symbols-outlined text-[22px] ${iconColor}`}>{icon}</span>
        </div>
        {badge && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold mb-1" style={{ color: dark ? '#64748b' : '#94a3b8' }}>{label}</p>
      <h3 className="text-2xl font-extrabold" style={{ color: dark ? '#f1f5f9' : '#0f172a' }}>{value}</h3>
    </div>
  );
};

// ─── Visitor Chart ─────────────────────────────────────────────────────────────
const VisitorChart = ({
  stats,
  isDark,
  todayStr,
}: {
  stats: DailyVisitorStat[];
  isDark: boolean;
  todayStr: string;
}) => {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const gridColor  = isDark ? '#1e293b' : '#f1f5f9';
  const labelColor = isDark ? '#64748b' : '#94a3b8';
  const textColor  = isDark ? '#e2e8f0' : '#1e293b';

  const maxVal = Math.max(...stats.flatMap((s) => [s.visits, s.registrations, s.logins]), 1);
  const rows   = 5;
  const chartH = 180;

  const lines = [
    { key: 'visits'        as const, label: 'Tashriflar',       color: '#6366f1' },
    { key: 'registrations' as const, label: "Ro'yxatdan o'tish", color: '#22c55e' },
    { key: 'logins'        as const, label: 'Kirishlar',         color: '#f59e0b' },
  ];

  const pct = (v: number) => (v / maxVal) * chartH;

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-5 mb-4 flex-wrap">
        {lines.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-xs font-medium" style={{ color: labelColor }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: chartH + 28 }}>
        {/* Horizontal grid lines */}
        {Array.from({ length: rows + 1 }).map((_, i) => {
          const y = (i / rows) * chartH;
          const val = Math.round(maxVal * (1 - i / rows));
          return (
            <React.Fragment key={i}>
              <div
                className="absolute left-8 right-0 border-t"
                style={{ top: y, borderColor: gridColor }}
              />
              <span
                className="absolute left-0 text-[10px]"
                style={{ top: y - 7, color: labelColor, width: 28, textAlign: 'right' }}
              >
                {val > 0 ? val : ''}
              </span>
            </React.Fragment>
          );
        })}

        {/* Bars + labels */}
        <div
          className="absolute left-8 right-0 bottom-7 flex items-end"
          style={{ height: chartH }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex-1 flex items-end justify-center gap-0.5 relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {hovered === i && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 rounded-xl px-3 py-2 shadow-xl text-xs whitespace-nowrap"
                  style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${gridColor}`, color: textColor }}
                >
                  <p className="font-bold mb-1">{s.date}</p>
                  {lines.map((l) => (
                    <p key={l.key} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.label}: <b>{s[l.key]}</b>
                    </p>
                  ))}
                </div>
              )}

              {/* Bars */}
              {lines.map((l) => (
                <div
                  key={l.key}
                  className="rounded-t-sm transition-all duration-300"
                  style={{
                    width: '28%',
                    height: Math.max(pct(s[l.key]), s[l.key] > 0 ? 4 : 0),
                    backgroundColor: hovered === i ? l.color : `${l.color}cc`,
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* X labels */}
        <div className="absolute left-8 right-0 bottom-0 flex" style={{ height: 24 }}>
          {stats.map((s, i) => {
            const isToday = s.date === todayStr;
            return (
              <div key={i} className="flex-1 text-center">
                {isToday ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={{ backgroundColor: '#6366f1', color: '#ffffff' }}>
                    Bugun
                  </span>
                ) : (
                  <span className="text-[10px]" style={{ color: labelColor }}>
                    {s.date.slice(5)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {lines.map((l) => {
          const total = stats.reduce((sum, s) => sum + s[l.key], 0);
          const avg   = stats.length ? Math.round(total / stats.length) : 0;
          return (
            <div key={l.key} className="rounded-xl p-3 text-center"
              style={{ backgroundColor: `${l.color}15`, border: `1px solid ${l.color}30` }}>
              <p className="text-[11px] font-medium mb-0.5" style={{ color: l.color }}>{l.label}</p>
              <p className="text-xl font-extrabold" style={{ color: l.color }}>{total}</p>
              <p className="text-[10px]" style={{ color: labelColor }}>o'rt: {avg}/kun</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Progress Bar ──────────────────────────────────────────────────────────────
const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="w-full bg-slate-100 dark:bg-[#1e293b] h-2 rounded-full overflow-hidden">
      <div
        className={`${color} h-full rounded-full transition-all duration-700`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const AdminPage = () => {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const user = useReactiveVar(userVar);
  const isAdmin = user.userType === UserType.ADMIN;

  // ─── Dark mode tokens ──────────────────────────────────────────────────────
  const pageBg     = isDark ? '#0a0f1a' : '#f8fafc';
  const cardBg     = isDark ? '#0f172a' : '#ffffff';
  const cardBorder = isDark ? '#1e293b' : '#e2e8f0';
  const textPrim   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec    = isDark ? '#94a3b8' : '#64748b';
  const inputBg    = isDark ? '#1e293b' : '#ffffff';
  const inputBorder = isDark ? '#334155' : '#e2e8f0';
  const headerBg   = isDark ? 'rgba(10,15,26,0.9)' : 'rgba(255,255,255,0.85)';

  const [activeSection, setActiveSection] = useState('dashboard');
  const [userFilterTab, setUserFilterTab] = useState(0);

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Visitor detail modal
  const [detailModal, setDetailModal] = useState<{
    open: boolean;
    date: string;
    event: string;
    label: string;
  }>({ open: false, date: '', event: '', label: '' });

  const [showVisitorStats, setShowVisitorStats] = useState(false);
  const [sessionDate, setSessionDate] = useState<string>('');

  // Delete user dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
  }>({ open: false, userId: '', username: '' });

  // Spam dialog
  const [spamDialog, setSpamDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
  }>({ open: false, userId: '', username: '' });
  const [spamReason, setSpamReason] = useState('');

  // Announcement dialog
  const [announcementDialog, setAnnouncementDialog] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annImageUrl, setAnnImageUrl] = useState('');
  const [annType, setAnnType] = useState<AnnouncementType>(AnnouncementType.ANNOUNCEMENT);

  // Notification dialog
  const [notifDialog, setNotifDialog] = useState<{
    open: boolean;
    userId: string;
    username: string;
    broadcast: boolean;
  }>({ open: false, userId: '', username: '', broadcast: false });
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // Session detail
  const [selectedSession, setSelectedSession] = useState<VisitorSessionItem | null>(null);

  // Search states
  const [userSearch, setUserSearch] = useState('');
  const [jobSearch, setJobSearch] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(
    ADMIN_GET_ALL_USERS,
    { variables: { page: 1, limit: 100 }, skip: !isAdmin, fetchPolicy: 'cache-and-network' },
  );

  const { data: jobsData, loading: jobsLoading, refetch: refetchJobs } = useQuery(
    ADMIN_GET_ALL_JOBS,
    {
      variables: { page: 1, limit: 100 },
      skip: !isAdmin || activeSection !== 'jobs',
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: postsData, loading: postsLoading, refetch: refetchPosts } = useQuery(
    ADMIN_GET_ALL_POSTS,
    {
      variables: { page: 1, limit: 100 },
      skip: !isAdmin || activeSection !== 'posts',
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: annData, loading: annLoading, refetch: refetchAnn } = useQuery(
    ADMIN_GET_ALL_ANNOUNCEMENTS,
    {
      skip: !isAdmin || activeSection !== 'announcements',
      fetchPolicy: 'cache-and-network',
    },
  );

  const { data: statsData, loading: statsLoading } = useQuery(ADMIN_GET_DASHBOARD_STATS, {
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
  });

  const [chartDays, setChartDays] = React.useState(7);
  const { data: visitorData } = useQuery(ADMIN_GET_VISITOR_STATS, {
    variables: { days: chartDays },
    skip: !isAdmin || activeSection !== 'dashboard',
    fetchPolicy: 'cache-and-network',
  });

  const { data: sessionsData, refetch: refetchSessions } = useQuery(ADMIN_GET_TODAY_SESSIONS, {
    variables: { date: sessionDate || null },
    skip: !isAdmin || activeSection !== 'dashboard',
    fetchPolicy: 'network-only',
    pollInterval: showVisitorStats && !sessionDate ? 30_000 : 0,
  });

  const [fetchUserDetails, { data: detailData, loading: detailLoading }] = useLazyQuery(
    ADMIN_GET_DAILY_USER_DETAILS,
    { fetchPolicy: 'network-only' },
  );

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
  const detailUsers = detailData?.adminGetDailyUserDetails ?? [];
  const todaySessions: VisitorSessionItem[] = sessionsData?.adminGetTodaySessions ?? [];
  const onlineSessions = todaySessions.filter((s) => s.isOnline);
  const allAnn: Announcement[] = annData?.adminGetAllAnnouncements ?? [];
  const stats: DashboardStats | null = statsData?.adminGetDashboardStats ?? null;

  const todayStr = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const todayStat = visitorStats.find((s) => s.date === todayStr);

  const userTabs = [
    allUsers,
    allUsers.filter((u) => u.userType === UserType.AGENT),
    allUsers.filter((u) => u.userType === UserType.FREELANCER),
    allUsers.filter((u) => u.userStatus === UserStatus.SPAM),
  ];

  const filteredUsers = userTabs[userFilterTab].filter(
    (u) =>
      !userSearch ||
      u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredJobs = allJobs.filter(
    (j) => !jobSearch || j.title?.toLowerCase().includes(jobSearch.toLowerCase()),
  );

  // ── Helpers ────────────────────────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(''); }
    else { setSuccessMsg(msg); setErrorMsg(''); }
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 4000);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
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
      notify(`Foydalanuvchi holati ${newStatus} ga o'zgartirildi.`);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Holat o\'zgartirish muvaffaqiyatsiz', true);
    }
    setSpamDialog({ open: false, userId: '', username: '' });
  };

  const handleChangeRole = async (userId: string, role: UserType) => {
    try {
      await changeRole({ variables: { input: { userId, newRole: role } } });
      notify('Rol yangilandi.');
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Rol o\'zgartirish muvaffaqiyatsiz', true);
    }
  };

  const handleDeleteUser = (userId: string, name: string) => {
    setDeleteDialog({ open: true, userId, username: name });
  };

  const confirmDeleteUser = async () => {
    const { userId, username } = deleteDialog;
    try {
      await deleteUser({ variables: { userId } });
      notify(`"@${username}" o'chirildi.`);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'O\'chirib bo\'lmadi', true);
    }
    setDeleteDialog({ open: false, userId: '', username: '' });
  };

  const handleDeleteJob = async (jobId: string, title: string) => {
    if (!window.confirm(`"${title}" e'lonini o'chirasizmi?`)) return;
    try {
      await deleteJob({ variables: { jobId } });
      notify('E\'lon o\'chirildi.');
      refetchJobs();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'O\'chirib bo\'lmadi', true);
    }
  };

  const handleDeletePost = async (postId: string, title: string) => {
    if (!window.confirm(`"${title}" maqolasini o'chirasizmi?`)) return;
    try {
      await deletePost({ variables: { postId } });
      notify('Maqola o\'chirildi.');
      refetchPosts();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'O\'chirib bo\'lmadi', true);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) {
      notify('Sarlavha va matn talab qilinadi.', true);
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
      notify("E'lon yaratildi va foydalanuvchilarga yuborildi!");
      setAnnouncementDialog(false);
      setAnnTitle('');
      setAnnBody('');
      setAnnImageUrl('');
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Yaratib bo\'lmadi', true);
    }
  };

  const handleToggleAnn = async (id: string) => {
    try {
      await toggleAnnouncement({ variables: { announcementId: id } });
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Muvaffaqiyatsiz', true);
    }
  };

  const handleDeleteAnn = async (id: string, title: string) => {
    if (!window.confirm(`"${title}" e'lonini o'chirasizmi?`)) return;
    try {
      await deleteAnnouncement({ variables: { announcementId: id } });
      notify("E'lon o'chirildi.");
      refetchAnn();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Muvaffaqiyatsiz', true);
    }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      notify('Sarlavha va xabar talab qilinadi.', true);
      return;
    }
    try {
      if (notifDialog.broadcast) {
        await sendBroadcast({ variables: { title: notifTitle, description: notifBody } });
        notify('Xabar barcha foydalanuvchilarga yuborildi!');
      } else {
        await sendNotification({
          variables: { userId: notifDialog.userId, title: notifTitle, description: notifBody },
        });
        notify(`Xabar @${notifDialog.username} ga yuborildi`);
      }
      setNotifDialog({ open: false, userId: '', username: '', broadcast: false });
      setNotifTitle('');
      setNotifBody('');
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? 'Yuborib bo\'lmadi', true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-red-600">shield</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Kirish taqiqlangan</h2>
          <p className="text-slate-500 text-sm mb-6">
            Bu sahifa faqat administratorlar uchun.
          </p>
          <Link
            href="/_admin/login"
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Dashboard section ──────────────────────────────────────────────────────
  const chartData = visitorStats
    .slice(-7)
    .map((s) => ({ label: s.date.slice(5), value: s.visits }));

  // Haqiqiy o'sish foizi — bu hafta vs o'tgan hafta (visitorStats asosida)
  const calcGrowth = (current: number, previous: number): { badge: string; color: string } => {
    if (previous === 0 && current === 0) return { badge: '—', color: 'bg-slate-100 text-slate-500' };
    if (previous === 0) return { badge: `+${current} yangi`, color: 'bg-green-50 text-green-600' };
    const pct = Math.round(((current - previous) / previous) * 100);
    if (pct > 0)  return { badge: `+${pct}%`, color: 'bg-green-50 text-green-600' };
    if (pct < 0)  return { badge: `${pct}%`,  color: 'bg-red-50 text-red-500' };
    return { badge: '0%', color: 'bg-slate-100 text-slate-500' };
  };

  // So'nggi 7 kun va oldingi 7 kun tashriflari
  const last7  = visitorStats.slice(-7).reduce((s, d) => s + d.visits, 0);
  const prev7  = visitorStats.slice(-14, -7).reduce((s, d) => s + d.visits, 0);
  const last7r = visitorStats.slice(-7).reduce((s, d) => s + d.registrations, 0);
  const prev7r = visitorStats.slice(-14, -7).reduce((s, d) => s + d.registrations, 0);

  const visitGrowth = calcGrowth(last7, prev7);
  const userGrowth  = calcGrowth(last7r, prev7r);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Admin Panel — BuFu</title>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </Head>

      <style>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
          font-style: normal;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          vertical-align: middle;
        }
        body { font-family: 'Inter', sans-serif; }
        .glass-card {
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226,232,240,0.8);
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c7c4d8; border-radius: 10px; }
      `}</style>

      <div className="flex min-h-screen font-sans" style={{ backgroundColor: pageBg }}>
        {/* Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onNav={(id) => setActiveSection(id)}
          onLogout={handleLogout}
          username={user.username ?? 'admin'}
          isDark={isDark}
        />

        {/* Main */}
        <main className="ml-64 flex-1 flex flex-col min-h-screen">
          {/* Top header */}
          <header className="sticky top-0 z-40 backdrop-blur-md px-8 py-4 flex items-center justify-between"
            style={{ backgroundColor: headerBg, borderBottom: `1px solid ${cardBorder}` }}>
            <div>
              <h1 className="text-xl font-bold" style={{ color: textPrim }}>
                {NAV_ITEMS.find((n) => n.id === activeSection)?.label ?? 'Boshqaruv paneli'}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: textSec }}>Platformaning bugungi holatini kuzating</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden lg:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                  search
                </span>
                <input
                  className="pl-9 pr-4 py-2 text-sm rounded-xl w-56 outline-none transition-all focus:ring-2 focus:ring-indigo-500/20"
                  style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrim }}
                  placeholder="Qidirish..."
                  type="text"
                />
              </div>
              {/* Notifications */}
              <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
              </button>
              {/* Broadcast shortcut */}
              <button
                onClick={() => {
                  setActiveSection('announcements');
                  setNotifDialog({ open: true, userId: '', username: '', broadcast: true });
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">campaign</span>
                Broadcast
              </button>
            </div>
          </header>

          {/* Alert banners */}
          {errorMsg && (
            <div className="mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="mx-8 mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {successMsg}
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 p-8">

            {/* ── DASHBOARD ──────────────────────────────────────────────── */}
            {activeSection === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats grid */}
                {statsLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : stats ? (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <StatCard
                        icon="group"
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                        label="Jami foydalanuvchilar"
                        value={stats.totalUsers?.toLocaleString() ?? '—'}
                        badge={userGrowth.badge}
                        badgeColor={userGrowth.color}
                        onClick={() => setActiveSection('users')}
                      />
                      <StatCard
                        icon="work"
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                        label="Faol ishlar"
                        value={stats.activeJobs?.toLocaleString() ?? '—'}
                        badge={visitGrowth.badge}
                        badgeColor={visitGrowth.color}
                        onClick={() => setActiveSection('jobs')}
                      />
                      <StatCard
                        icon="payments"
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                        label="Jami byudjet"
                        value={`$${Number(stats.totalBudgetPosted ?? 0).toLocaleString()}`}
                        badge="Barcha vaqt"
                        badgeColor="bg-slate-100 text-slate-500 dark:text-slate-400"
                        onClick={() => setActiveSection('payments')}
                      />
                      <StatCard
                        icon="pending_actions"
                        iconBg="bg-red-50"
                        iconColor="text-red-500"
                        label="Spam foydalanuvchilar"
                        value={stats.spammedUsers ?? 0}
                        badge="Shoshilinch"
                        badgeColor="bg-red-50 text-red-500"
                        onClick={() => setActiveSection('users')}
                      />
                    </div>

                    {/* Secondary stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                      {[
                        { label: 'Agentlar',    value: stats.totalAgents,        color: 'text-cyan-600',    section: 'users' },
                        { label: 'Frilanserlar', value: stats.totalFreelancers,  color: 'text-violet-600',  section: 'users' },
                        { label: 'Jami ishlar', value: stats.totalJobs,          color: 'text-indigo-600',  section: 'jobs' },
                        { label: 'Maqolalar',   value: stats.totalPosts,         color: 'text-sky-600',     section: 'posts' },
                        { label: "E'lonlar",    value: stats.totalAnnouncements, color: 'text-emerald-600', section: 'announcements' },
                      ].map((s) => (
                        <div
                          key={s.label}
                          onClick={() => setActiveSection(s.section)}
                          className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-xl p-4 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:-translate-y-0.5 transition-all duration-200"
                        >
                          <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                          <p className={`text-2xl font-extrabold ${s.color}`}>{s.value ?? 0}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 text-sm">Ma'lumot yo'q.</p>
                )}

                {/* Bento grid: charts + moderation */}
                <div className="grid grid-cols-12 gap-4">
                  {/* Growth chart */}
                  <div className="col-span-12 lg:col-span-8 rounded-2xl p-6 shadow-sm"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h2 className="text-base font-bold" style={{ color: textPrim }}>Platforma o&apos;sishi (tashriflar)</h2>
                        <p className="text-xs mt-0.5" style={{ color: textSec }}>Kunlik tashriflar, ro&apos;yxatdan o&apos;tishlar va kirishlar</p>
                      </div>
                      <select
                        value={chartDays}
                        onChange={(e) => setChartDays(Number(e.target.value))}
                        className="text-xs rounded-lg px-3 py-1.5 outline-none font-semibold"
                        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textSec }}
                      >
                        <option value={7}>Oxirgi 7 kun</option>
                        <option value={14}>Oxirgi 14 kun</option>
                        <option value={30}>Oxirgi 30 kun</option>
                      </select>
                    </div>
                    {visitorStats.length > 0 ? (
                      <VisitorChart stats={visitorStats.slice(-chartDays)} isDark={isDark} todayStr={todayStr} />
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center gap-2 rounded-xl"
                        style={{ backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                        <span className="material-symbols-outlined text-3xl text-slate-400">bar_chart</span>
                        <p className="text-xs text-slate-400">Ma&apos;lumot mavjud emas</p>
                      </div>
                    )}
                  </div>

                  {/* Visitor stats mini card */}
                  <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Bugungi statistika</h2>
                    {todayStat ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                          <div>
                            <p className="text-xs text-indigo-400 font-medium">Tashriflar</p>
                            <p className="text-2xl font-extrabold text-indigo-600">{todayStat.visits}</p>
                          </div>
                          <span className="material-symbols-outlined text-indigo-300 text-3xl">visibility</span>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setDetailModal({ open: true, date: todayStr, event: 'register', label: "Ro'yxatdan o'tganlar" });
                              fetchUserDetails({ variables: { date: todayStr, event: 'register' } });
                            }}
                            className="flex-1 p-3 bg-green-50 rounded-xl text-center hover:bg-green-100 transition-colors cursor-pointer"
                          >
                            <p className="text-xs text-green-500 font-medium">Ro'yxatdan</p>
                            <p className="text-xl font-extrabold text-green-600">{todayStat.registrations}</p>
                          </button>
                          <button
                            onClick={() => {
                              setDetailModal({ open: true, date: todayStr, event: 'login', label: "Login bo'lganlar" });
                              fetchUserDetails({ variables: { date: todayStr, event: 'login' } });
                            }}
                            className="flex-1 p-3 bg-amber-50 rounded-xl text-center hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            <p className="text-xs text-amber-500 font-medium">Login</p>
                            <p className="text-xl font-extrabold text-amber-600">{todayStat.logins}</p>
                          </button>
                        </div>
                        {onlineSessions.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                            <span className="text-xs font-semibold text-green-700">
                              {onlineSessions.length} foydalanuvchi onlayn
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">Bugun ma'lumot yo'q</p>
                    )}
                  </div>

                  {/* Recent transactions / activity */}
                  <div className="col-span-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1e293b]">
                      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">So'nggi faollik</h2>
                      <button
                        onClick={() => setActiveSection('users')}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        Hammasi
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-[#1e293b] bg-slate-50/60 dark:bg-[#1e293b]/40">
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Foydalanuvchi</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Tur</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Holat</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Sana</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                          {allUsers.slice(0, 5).map((u) => (
                            <tr key={u._id} className="hover:bg-slate-100/60 dark:hover:bg-[#1e293b]/50 transition-colors">
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 overflow-hidden">
                                    {u.profileImage ? (
                                      <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      (u.fullName || u.username)?.[0]?.toUpperCase()
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{u.fullName ?? u.username}</p>
                                    <p className="text-xs text-slate-400">@{u.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                  u.userType === UserType.FREELANCER
                                    ? 'bg-indigo-50 text-indigo-600'
                                    : u.userType === UserType.AGENT
                                    ? 'bg-sky-50 text-sky-600'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {u.userType}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: STATUS_COLOR[u.userStatus] ?? '#94a3b8' }}
                                  />
                                  <span className="text-xs font-semibold" style={{ color: STATUS_COLOR[u.userStatus] ?? '#94a3b8' }}>
                                    {u.userStatus === 'ACTIVE' ? 'Faol' : u.userStatus === 'SPAM' ? 'Spam' : u.userStatus}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-400">
                                {u.createdAt
                                  ? new Date(Number(u.createdAt)).toISOString().slice(0, 10)
                                  : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audience analysis */}
                  <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Foydalanuvchilar taqsimoti</h2>
                    <div className="space-y-4">
                      <ProgressBar
                        label="Frilanserlar"
                        value={
                          stats && stats.totalUsers > 0
                            ? Math.round((stats.totalFreelancers / stats.totalUsers) * 100)
                            : 64
                        }
                        color="bg-indigo-500"
                      />
                      <ProgressBar
                        label="Agentlar / Mijozlar"
                        value={
                          stats && stats.totalUsers > 0
                            ? Math.round((stats.totalAgents / stats.totalUsers) * 100)
                            : 36
                        }
                        color="bg-violet-400"
                      />
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-sm">
                    <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-4">Tezkor amallar</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => { setActiveSection('announcements'); setAnnouncementDialog(true); }}
                        className="flex items-center gap-2 px-3 py-3 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-xl hover:bg-indigo-100 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">campaign</span>
                        Yangi e'lon
                      </button>
                      <button
                        onClick={() => setNotifDialog({ open: true, userId: '', username: '', broadcast: true })}
                        className="flex items-center gap-2 px-3 py-3 bg-slate-50 dark:bg-[#0a0f1a] text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors border border-slate-200 dark:border-[#1e293b]"
                      >
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        Broadcast
                      </button>
                      <button
                        onClick={() => setActiveSection('users')}
                        className="flex items-center gap-2 px-3 py-3 bg-slate-50 dark:bg-[#0a0f1a] text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors border border-slate-200 dark:border-[#1e293b]"
                      >
                        <span className="material-symbols-outlined text-[20px]">group</span>
                        Foydalanuvchilar
                      </button>
                      <button
                        onClick={() => setActiveSection('jobs')}
                        className="flex items-center gap-2 px-3 py-3 bg-slate-50 dark:bg-[#0a0f1a] text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors border border-slate-200 dark:border-[#1e293b]"
                      >
                        <span className="material-symbols-outlined text-[20px]">work</span>
                        Ish e'lonlari
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visitor stats toggle */}
                <div>
                  <button
                    onClick={() => setShowVisitorStats((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                    Tashrif buyuruvchilar statistikasi
                    <span className="material-symbols-outlined text-[16px]">
                      {showVisitorStats ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>

                {/* Visitor stats panel */}
                {showVisitorStats && (
                  <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl p-6 shadow-sm">
                    {/* Session filter */}
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-orange-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {sessionDate ? `${sessionDate} tashriflari` : 'Bugungi tashriflar'}{' '}
                          ({todaySessions.length})
                        </span>
                        {!sessionDate && onlineSessions.length > 0 && (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            {onlineSessions.length} online
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={sessionDate}
                          max={todayStr}
                          onChange={(e) => {
                            setSessionDate(e.target.value);
                            setTimeout(() => refetchSessions(), 0);
                          }}
                          className="text-xs border border-slate-200 dark:border-[#1e293b] rounded-lg px-3 py-1.5 outline-none focus:border-indigo-400"
                        />
                        {sessionDate && (
                          <button
                            onClick={() => { setSessionDate(''); setTimeout(() => refetchSessions(), 0); }}
                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800"
                          >
                            Bugun
                          </button>
                        )}
                        <button
                          onClick={() => refetchSessions()}
                          className="text-xs text-indigo-600 hover:underline font-semibold"
                        >
                          Yangilash
                        </button>
                      </div>
                    </div>

                    {/* Sessions table */}
                    {todaySessions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">Bu kunda tashrif yo'q</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0a0f1a]">
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Holat</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Foydalanuvchi</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Qurilma</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">OS / Brauzer</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Sahifalar</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Kirdi</th>
                              <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Chiqdi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                            {[...todaySessions]
                              .sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0))
                              .map((s) => (
                                <tr
                                  key={s.sessionId}
                                  onClick={() => setSelectedSession(s)}
                                  className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors ${s.isOnline ? 'dark:bg-green-900/10 bg-green-50/50' : ''}`}
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`w-2 h-2 rounded-full ${s.isOnline ? 'bg-green-500 animate-pulse' : s.endedAt ? 'bg-slate-300' : 'bg-amber-400'}`}
                                      />
                                      <span className={`font-semibold ${s.isOnline ? 'text-green-600' : s.endedAt ? 'text-slate-400' : 'text-amber-600'}`}>
                                        {s.isOnline ? 'Online' : s.endedAt ? 'Chiqdi' : 'Faolsiz'}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                                    {s.userName ?? <span className="text-slate-400 italic">Guest</span>}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.device}</td>
                                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.os} / {s.browser}</td>
                                  <td className="px-4 py-3">
                                    <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded">
                                      {s.pages.length}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                                    {new Date(s.startedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-400">
                                    {s.endedAt
                                      ? new Date(s.endedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                                      : s.isOnline
                                      ? '—'
                                      : `~${new Date(s.lastSeenAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}`}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 14-day table */}
                    {visitorStats.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">So'nggi 14 kun</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-[#1e293b] bg-slate-50 dark:bg-[#0a0f1a]">
                                <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Sana</th>
                                <th className="px-4 py-3 font-bold text-indigo-500 text-center">Tashriflar</th>
                                <th className="px-4 py-3 font-bold text-green-500 text-center">Ro'yxatdan</th>
                                <th className="px-4 py-3 font-bold text-amber-500 text-center">Login</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                              {[...visitorStats].reverse().map((s) => (
                                <tr key={s.date} className={`hover:bg-slate-50 dark:hover:bg-[#1e293b]/50 ${s.date === todayStr ? 'dark:bg-green-900/10 bg-green-50/50' : ''}`}>
                                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-600 dark:text-slate-400">
                                    {s.date}
                                    {s.date === todayStr && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">bugun</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 font-bold rounded">{s.visits}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <button
                                      onClick={() => {
                                        setDetailModal({ open: true, date: s.date, event: 'register', label: "Ro'yxatdan o'tganlar" });
                                        fetchUserDetails({ variables: { date: s.date, event: 'register' } });
                                      }}
                                      className="px-2 py-0.5 bg-green-50 text-green-600 font-bold rounded hover:bg-green-100 transition-colors cursor-pointer"
                                    >
                                      {s.registrations}
                                    </button>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <button
                                      onClick={() => {
                                        setDetailModal({ open: true, date: s.date, event: 'login', label: "Login bo'lganlar" });
                                        fetchUserDetails({ variables: { date: s.date, event: 'login' } });
                                      }}
                                      className="px-2 py-0.5 bg-amber-50 text-amber-600 font-bold rounded hover:bg-amber-100 transition-colors cursor-pointer"
                                    >
                                      {s.logins}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── USERS ──────────────────────────────────────────────────── */}
            {activeSection === 'users' && (
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Foydalanuvchilar boshqaruvi</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Platformadagi barcha frilanserlar va mijozlarni nazorat qilish.</p>
                  </div>
                  <Link
                    href="/users.tsx"
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Yangi foydalanuvchi
                  </Link>
                </div>

                {/* Stats mini */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: 'Umumiy', value: allUsers.length, dot: '#6366f1', dotLabel: null },
                    { label: 'Online foydalanuvchilar', value: allUsers.filter((u) => u.userStatus === UserStatus.ACTIVE).length, dot: '#22c55e', dotLabel: 'faol' },
                    { label: 'Faolsiz foydalanuvchilar', value: allUsers.filter((u) => u.userStatus !== UserStatus.ACTIVE && u.userStatus !== UserStatus.SPAM).length, dot: '#94a3b8', dotLabel: 'faolsiz' },
                    { label: 'Spam / Bloklangan', value: allUsers.filter((u) => u.userStatus === UserStatus.SPAM).length, dot: '#ef4444', dotLabel: 'spam' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${s.dot}20` }}>
                        <span className="w-4 h-4 rounded-full" style={{ backgroundColor: s.dot }} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{s.label}</p>
                        <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{s.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filter bar */}
                <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 mb-4 flex flex-col lg:flex-row gap-3 items-center">
                  <div className="relative w-full lg:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-[#0a0f1a] border border-slate-200 dark:border-[#1e293b] rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                      placeholder="Ism yoki username bo'yicha qidirish..."
                      type="text"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full lg:w-auto">
                    {['Barchasi', 'Agentlar', 'Frilanserlar', 'Spam'].map((label, i) => (
                      <button
                        key={label}
                        onClick={() => setUserFilterTab(i)}
                        className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                          userFilterTab === i
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {label} ({userTabs[i].length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-hidden shadow-sm">
                  {usersLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 dark:border-[#1e293b]">
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Foydalanuvchi</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Holat</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Spam sababi</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Qo'shilgan</th>
                              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amallar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                            {filteredUsers.map((u, idx) => (
                              <tr
                                key={u._id}
                                className={`hover:bg-slate-100/60 dark:hover:bg-[#1e293b]/50 transition-colors ${u.userStatus === UserStatus.SPAM ? 'bg-red-50/30 dark:bg-red-900/20' : ''}`}
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm overflow-hidden">
                                        {u.profileImage ? (
                                          <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          (u.fullName || u.username)?.[0]?.toUpperCase()
                                        )}
                                      </div>
                                      {u.userStatus === UserStatus.ACTIVE && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                      )}
                                    </div>
                                    <div>
                                      <Link href={`/profile/${u._id}`}>
                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-indigo-600 transition-colors">
                                          {u.fullName ?? u.username}
                                        </p>
                                      </Link>
                                      <p className="text-xs text-slate-400">@{u.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">@{u.username ?? '—'}</td>
                                <td className="px-6 py-4">
                                  {u.userType === UserType.ADMIN ? (
                                    <span className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded-full">ADMIN</span>
                                  ) : (
                                    <select
                                      value={u.userType}
                                      onChange={(e) => handleChangeRole(u._id, e.target.value as UserType)}
                                      className="text-xs border border-slate-200 dark:border-[#1e293b] rounded-lg px-2 py-1 bg-white dark:bg-[#0f172a] outline-none focus:border-indigo-400"
                                    >
                                      <option value={UserType.AGENT}>Agent</option>
                                      <option value={UserType.FREELANCER}>Frilanser</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {u.userType === UserType.ADMIN ? (
                                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">FAOL</span>
                                  ) : (
                                    <select
                                      value={u.userStatus}
                                      onChange={(e) => handleStatusChange(u._id, u.username, e.target.value as UserStatus)}
                                      className="text-xs border border-slate-200 dark:border-[#1e293b] rounded-lg px-2 py-1 bg-white dark:bg-[#0f172a] outline-none focus:border-indigo-400"
                                      style={{ color: STATUS_COLOR[u.userStatus] }}
                                    >
                                      <option value={UserStatus.ACTIVE} style={{ color: '#16a34a' }}>Faol</option>
                                      <option value={UserStatus.SPAM} style={{ color: '#f59e0b' }}>Spam</option>
                                    </select>
                                  )}
                                </td>
                                <td className="px-6 py-4 max-w-[160px]">
                                  <p className="text-xs text-slate-400 truncate">{u.spamReason || '—'}</p>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                                  {u.createdAt ? new Date(Number(u.createdAt)).toISOString().slice(0, 10) : '—'}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {u.userType !== UserType.ADMIN && (
                                      <>
                                        <button
                                          onClick={() =>
                                            setNotifDialog({ open: true, userId: u._id, username: u.username, broadcast: false })
                                          }
                                          title="Xabar yuborish"
                                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[18px]">notifications</span>
                                        </button>
                                        <button
                                          onClick={() => handleDeleteUser(u._id, u.username)}
                                          title="O'chirish"
                                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                                  Bu kategoriyada foydalanuvchi yo'q.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {/* Pagination indicator */}
                      <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1e293b] dark:bg-[#1e293b]/30 flex items-center justify-between">
                        <span className="text-sm text-slate-400">
                          {filteredUsers.length} ta foydalanuvchi ko'rsatilmoqda
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── JOBS ──────────────────────────────────────────────────── */}
            {activeSection === 'jobs' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Ish e'lonlari</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Platformadagi barcha ish e'lonlarini boshqaring.</p>
                  </div>
                </div>
                {/* Search */}
                <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 mb-4">
                  <div className="relative w-full lg:w-80">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-[#0a0f1a] border border-slate-200 dark:border-[#1e293b] rounded-xl outline-none focus:border-indigo-400"
                      placeholder="E'lon nomini qidirish..."
                    />
                  </div>
                </div>
                <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-hidden shadow-sm">
                  {jobsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 dark:border-[#1e293b]">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">#</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sarlavha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Kategoriya</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Holat</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Byudjet</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Agent</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Takliflar</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sana</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                          {filteredJobs.map((j, idx) => (
                            <tr key={j._id} className="hover:bg-slate-100/60 dark:hover:bg-[#1e293b]/50 transition-colors">
                              <td className="px-6 py-3 text-xs text-slate-400">{idx + 1}</td>
                              <td className="px-6 py-3">
                                <Link href={`/jobs/${j._id}`}>
                                  <p className="text-sm font-semibold text-indigo-600 hover:underline max-w-[200px] truncate">
                                    {j.title}
                                  </p>
                                </Link>
                              </td>
                              <td className="px-6 py-3">
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-[#1e293b] text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full">
                                  {j.category}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <span
                                  className="px-2.5 py-1 text-xs font-bold rounded-full"
                                  style={{
                                    backgroundColor: `${JOB_STATUS_COLOR[j.status]}22`,
                                    color: JOB_STATUS_COLOR[j.status],
                                  }}
                                >
                                  {j.status}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">${j.budget}</td>
                              <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{j.agentName ?? '—'}</td>
                              <td className="px-6 py-3 text-sm text-slate-400">{j.bidCount}</td>
                              <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                                {j.createdAt?.slice(0, 10) ?? '—'}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <button
                                  onClick={() => handleDeleteJob(j._id, j.title)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="O'chirish"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredJobs.length === 0 && (
                            <tr>
                              <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-400">
                                Ish e'lonlar topilmadi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── POSTS ──────────────────────────────────────────────────── */}
            {activeSection === 'posts' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Maqolalar</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Platformadagi barcha maqolalar.</p>
                </div>
                <div className="bg-white border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-hidden shadow-sm">
                  {postsLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 dark:border-[#1e293b]">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">#</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sarlavha</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Muallif</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Yoqtirishlar</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Ko'rishlar</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Sana</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                          {allPosts.map((p, idx) => (
                            <tr key={p._id} className="hover:bg-slate-100/60 dark:hover:bg-[#1e293b]/50 transition-colors">
                              <td className="px-6 py-3 text-xs text-slate-400">{idx + 1}</td>
                              <td className="px-6 py-3">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 max-w-[240px] truncate">{p.title}</p>
                              </td>
                              <td className="px-6 py-3 text-sm text-slate-500 dark:text-slate-400">{p.authorName}</td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                  <span className="material-symbols-outlined text-[16px] text-red-400">favorite</span>
                                  {p.likeCount}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex items-center gap-1 text-sm text-slate-400">
                                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                                  {p.viewCount}
                                </div>
                              </td>
                              <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                                {p.createdAt?.slice(0, 10) ?? '—'}
                              </td>
                              <td className="px-6 py-3 text-right">
                                <button
                                  onClick={() => handleDeletePost(p._id, p.title)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="O'chirish"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {allPosts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                                Maqolalar topilmadi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ANNOUNCEMENTS ──────────────────────────────────────────── */}
            {activeSection === 'announcements' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">E'lonlar</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Platforma bo'ylab e'lonlarni boshqaring.</p>
                  </div>
                  <button
                    onClick={() => setAnnouncementDialog(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Yangi e'lon
                  </button>
                </div>
                {annLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allAnn.map((a) => (
                      <div
                        key={a._id}
                        className={`bg-white border rounded-2xl p-5 shadow-sm transition-opacity ${
                          a.isActive ? 'border-slate-200' : 'border-amber-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                a.announcementType === AnnouncementType.ADVERTISEMENT
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                {a.announcementType}
                              </span>
                              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                                a.isActive ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                              }`}>
                                {a.isActive ? 'Faol' : 'Yashirin'}
                              </span>
                              <span className="text-xs text-slate-400">{a.createdAt?.slice(0, 10)}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">{a.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                              {a.body.slice(0, 200)}{a.body.length > 200 ? '...' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <button
                              onClick={() => handleToggleAnn(a._id)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#1e293b] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1e293b] transition-colors"
                            >
                              {a.isActive ? 'Yashirish' : "Ko'rsatish"}
                            </button>
                            <button
                              onClick={() => handleDeleteAnn(a._id, a.title)}
                              className="px-3 py-1.5 text-xs font-semibold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                            >
                              O'chirish
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {allAnn.length === 0 && (
                      <div className="text-center py-12 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl">
                        <span className="material-symbols-outlined text-4xl text-slate-300">campaign</span>
                        <p className="text-slate-400 mt-2">Hali e'lon yo'q. Birinchi e'lonni yarating!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── PAYMENTS placeholder ──────────────────────────────────── */}
            {activeSection === 'payments' && (
              <div className="text-center py-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-slate-300">payments</span>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-4">To'lovlar bo'limi</h3>
                <p className="text-slate-400 text-sm mt-1">Tez orada ishga tushadi</p>
              </div>
            )}

            {/* ── SETTINGS placeholder ──────────────────────────────────── */}
            {activeSection === 'settings' && (
              <div className="text-center py-20 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl">
                <span className="material-symbols-outlined text-5xl text-slate-300">settings</span>
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mt-4">Sozlamalar</h3>
                <p className="text-slate-400 text-sm mt-1">Tez orada ishga tushadi</p>
              </div>
            )}

            {/* ── NOTIFICATIONS section ──────────────────────────────────── */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bildirishnomalar yuborish</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Aniq foydalanuvchiga yoki barcha faol foydalanuvchilarga bildirishnoma yuboring.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setNotifDialog({ open: true, userId: '', username: '', broadcast: true })}
                    className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">campaign</span>
                    Barcha foydalanuvchilarga yuborish
                  </button>
                  <button
                    onClick={() => setActiveSection('users')}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    Foydalanuvchilar sahifasiga o'tish
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-[#1e293b] px-8 py-6 mt-auto bg-white/60 dark:bg-[#0f172a]/60">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-lg font-black text-indigo-600">BuFu</span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Markaziy Osiyodagi eng yirik frilans ekotizimi. Build Future (BuFu) admin tizimi.
                </p>
              </div>
              <p className="text-xs text-slate-400">© 2024 BuFu (Build Future). Barcha huquqlar himoyalangan.</p>
            </div>
          </footer>
        </main>
      </div>

      {/* ── Modal: Delete User ────────────────────────────────────────── */}
      {deleteDialog.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-red-600">delete</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Foydalanuvchini o'chirish</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              <strong>@{deleteDialog.username}</strong> foydalanuvchisini o'chirishni tasdiqlaysizmi?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Bu amalni ortga qaytarib bo'lmaydi. Foydalanuvchi va barcha ma'lumotlari o'chiriladi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, userId: '', username: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Spam Reason ────────────────────────────────────────── */}
      {spamDialog.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600">block</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Spam: @{spamDialog.username}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Foydalanuvchi spam sababi bilan xabardor qilinadi va hisobi cheklanadi.
            </p>
            <textarea
              value={spamReason}
              onChange={(e) => setSpamReason(e.target.value)}
              placeholder="Masalan: Soxta ish e'lonlari joylash. Platforma qoidalarini ko'p marta buzish."
              rows={3}
              className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl p-3 outline-none focus:border-amber-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSpamDialog({ open: false, userId: '', username: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => confirmStatusChange(spamDialog.userId, UserStatus.SPAM, spamReason)}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Create Announcement ───────────────────────────────── */}
      {announcementDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-indigo-600">campaign</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Yangi e'lon</h3>
              </div>
              <button onClick={() => setAnnouncementDialog(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Barcha faol foydalanuvchilarga bildirishnoma sifatida yuboriladi.
            </p>
            <div className="space-y-3 mb-4">
              {/* Type toggle */}
              <div className="flex gap-2">
                {[
                  { value: AnnouncementType.ANNOUNCEMENT, label: 'E\'lon' },
                  { value: AnnouncementType.ADVERTISEMENT, label: 'Reklama' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setAnnType(t.value)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      annType === t.value
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Sarlavha"
                className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400"
              />
              <textarea
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder="E'lon matni..."
                rows={4}
                className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl px-4 py-3 outline-none focus:border-indigo-400 resize-none"
              />
              <input
                value={annImageUrl}
                onChange={(e) => setAnnImageUrl(e.target.value)}
                placeholder="Rasm URL (ixtiyoriy)"
                className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAnnouncementDialog(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleCreateAnnouncement}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Nashr etish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Send Notification ─────────────────────────────────── */}
      {notifDialog.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-indigo-600">
                    {notifDialog.broadcast ? 'campaign' : 'notifications'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {notifDialog.broadcast
                    ? 'Broadcast bildirishnomasi'
                    : `@${notifDialog.username} ga xabar`}
                </h3>
              </div>
              <button
                onClick={() => setNotifDialog({ open: false, userId: '', username: '', broadcast: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {notifDialog.broadcast
                ? 'Bu xabar barcha faol foydalanuvchilarga yuboriladi.'
                : `Bildirishnoma @${notifDialog.username} ning notification belliga tushadi.`}
            </p>
            <div className="space-y-3 mb-4">
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Sarlavha"
                className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400"
              />
              <textarea
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Xabar matni..."
                rows={3}
                className="w-full text-sm border border-slate-200 dark:border-[#1e293b] rounded-xl px-4 py-3 outline-none focus:border-indigo-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNotifDialog({ open: false, userId: '', username: '', broadcast: false })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Yuborish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Session Detail ─────────────────────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${selectedSession.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Tashrif tafsiloti</h3>
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${selectedSession.isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {selectedSession.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Foydalanuvchi</p>
                <p className={`text-sm font-semibold ${selectedSession.userName ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                  {selectedSession.userName ?? 'Guest'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Qurilma', value: selectedSession.device },
                  { label: 'OS', value: selectedSession.os },
                  { label: 'Brauzer', value: selectedSession.browser },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Kirdi</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {new Date(selectedSession.startedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Chiqdi</p>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 font-mono">
                    {selectedSession.endedAt
                      ? new Date(selectedSession.endedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : selectedSession.isOnline
                      ? '— (online)'
                      : `~${new Date(selectedSession.lastSeenAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
                  </p>
                </div>
                {selectedSession.endedAt && (
                  <div>
                    <p className="text-xs text-slate-400">Davomiyligi</p>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {Math.round((new Date(selectedSession.endedAt).getTime() - new Date(selectedSession.startedAt).getTime()) / 60000)} daq
                    </p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-2">Ko'rilgan sahifalar ({selectedSession.pages.length})</p>
                <div className="bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5">
                  {selectedSession.pages.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs font-mono text-indigo-600">{p.path}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(p.visitedAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="pt-4 flex-shrink-0 border-t border-slate-100 dark:border-[#1e293b]">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Visitor User Details ──────────────────────────────── */}
      {detailModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[20px] ${detailModal.event === 'register' ? 'text-green-600' : 'text-amber-600'}`}>
                  {detailModal.event === 'register' ? 'person_add' : 'login'}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {detailModal.label} — {detailModal.date}
                </h3>
              </div>
              <button onClick={() => setDetailModal({ open: false, date: '', event: '', label: '' })} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : detailUsers.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">Ma'lumot yo'q</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 dark:border-[#1e293b]">
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Foydalanuvchi</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Tur</th>
                      <th className="px-4 py-3 font-bold text-slate-500 dark:text-slate-400">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
                    {detailUsers.map((u: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 overflow-hidden">
                              {u.profileImage ? (
                                <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (u.fullName || u.username)?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">{u.fullName || u.username}</p>
                              <p className="text-slate-400">@{u.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold ${
                            u.userType === 'FREELANCER'
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-sky-50 text-sky-600'
                          }`}>
                            {u.userType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="pt-4 flex-shrink-0 border-t border-slate-100 dark:border-[#1e293b]">
              <button
                onClick={() => setDetailModal({ open: false, date: '', event: '', label: '' })}
                className="w-full py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#1e293b] rounded-xl hover:bg-slate-200 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminPage;
