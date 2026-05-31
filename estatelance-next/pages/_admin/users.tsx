import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  ADMIN_GET_ALL_USERS,
  ADMIN_GET_DASHBOARD_STATS,
} from '../../apollo/admin/query';
import {
  ADMIN_CHANGE_USER_STATUS,
  ADMIN_CHANGE_USER_ROLE,
  ADMIN_DELETE_USER,
  ADMIN_SEND_NOTIFICATION,
} from '../../apollo/admin/mutation';
import { userVar } from '../../apollo/store';
import { logout } from '../../libs/auth';
import { User, DashboardStats } from '../../libs/types';
import { UserType, UserStatus } from '../../libs/enums';

// ─── Nav items ─────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Boshqaruv paneli', icon: 'dashboard', href: '/_admin' },
  { id: 'users', label: 'Foydalanuvchilar', icon: 'group', href: '/_admin/users' },
  { id: 'jobs', label: "Ish e'lonlari", icon: 'work', href: '/_admin' },
  { id: 'payments', label: "To'lovlar", icon: 'payments', href: '/_admin' },
  { id: 'posts', label: 'Maqolalar', icon: 'article', href: '/_admin' },
  { id: 'announcements', label: "E'lonlar", icon: 'campaign', href: '/_admin' },
  { id: 'settings', label: 'Sozlamalar', icon: 'settings', href: '/_admin' },
];

// ─── Status color map ──────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#16a34a',
  SPAM: '#f59e0b',
  DELETED: '#dc2626',
};

const FILTER_TABS = ['Barchasi', 'Frilanserlar', 'Agentlar', 'Spam'];

// ─── Component ─────────────────────────────────────────────────────────────────
const UsersPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);
  const isAdmin = user.userType === UserType.ADMIN;

  const [filterTab, setFilterTab] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });

  // Spam dialog
  const [spamDialog, setSpamDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });
  const [spamReason, setSpamReason] = useState('');

  // Notification dialog
  const [notifDialog, setNotifDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');

  // User detail panel
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useQuery(
    ADMIN_GET_ALL_USERS,
    { variables: { page: 1, limit: 500 }, skip: !isAdmin, fetchPolicy: 'cache-and-network' },
  );

  const { data: statsData } = useQuery(ADMIN_GET_DASHBOARD_STATS, {
    skip: !isAdmin,
    fetchPolicy: 'cache-and-network',
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [changeStatus] = useMutation(ADMIN_CHANGE_USER_STATUS);
  const [changeRole] = useMutation(ADMIN_CHANGE_USER_ROLE);
  const [deleteUser] = useMutation(ADMIN_DELETE_USER);
  const [sendNotification] = useMutation(ADMIN_SEND_NOTIFICATION);

  // ── Data ───────────────────────────────────────────────────────────────────
  const allUsers: User[] = usersData?.adminGetAllUsers ?? [];
  const stats: DashboardStats | null = statsData?.adminGetDashboardStats ?? null;

  // Filtered dataset
  const baseFiltered = (() => {
    let list = allUsers;
    if (filterTab === 1) list = list.filter((u) => u.userType === UserType.FREELANCER);
    if (filterTab === 2) list = list.filter((u) => u.userType === UserType.AGENT);
    if (filterTab === 3) list = list.filter((u) => u.userStatus === UserStatus.SPAM);
    if (statusFilter) list = list.filter((u) => u.userStatus === statusFilter);
    if (search)
      list = list.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()),
      );
    return list;
  })();

  const totalPages = Math.ceil(baseFiltered.length / PAGE_SIZE);
  const paginatedUsers = baseFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const notify = (msg: string, isError = false) => {
    if (isError) { setErrorMsg(msg); setSuccessMsg(''); }
    else { setSuccessMsg(msg); setErrorMsg(''); }
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 4000);
  };

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
      notify(`Holat ${newStatus} ga o'zgartirildi.`);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? "Holat o'zgartirish muvaffaqiyatsiz", true);
    }
    setSpamDialog({ open: false, userId: '', username: '' });
  };

  const handleChangeRole = async (userId: string, role: UserType) => {
    try {
      await changeRole({ variables: { input: { userId, newRole: role } } });
      notify('Rol yangilandi.');
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? "Rol o'zgartirish muvaffaqiyatsiz", true);
    }
  };

  const confirmDeleteUser = async () => {
    const { userId, username } = deleteDialog;
    try {
      await deleteUser({ variables: { userId } });
      notify(`"@${username}" o'chirildi.`);
      if (selectedUser?._id === userId) setSelectedUser(null);
      refetchUsers();
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? "O'chirib bo'lmadi", true);
    }
    setDeleteDialog({ open: false, userId: '', username: '' });
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !notifBody.trim()) {
      notify('Sarlavha va xabar talab qilinadi.', true);
      return;
    }
    try {
      await sendNotification({
        variables: { userId: notifDialog.userId, title: notifTitle, description: notifBody },
      });
      notify(`Xabar @${notifDialog.username} ga yuborildi`);
      setNotifDialog({ open: false, userId: '', username: '' });
      setNotifTitle('');
      setNotifBody('');
    } catch (err: any) {
      notify(err?.graphQLErrors?.[0]?.message ?? "Yuborib bo'lmadi", true);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // Tab counts
  const tabCounts = [
    allUsers.length,
    allUsers.filter((u) => u.userType === UserType.FREELANCER).length,
    allUsers.filter((u) => u.userType === UserType.AGENT).length,
    allUsers.filter((u) => u.userStatus === UserStatus.SPAM).length,
  ];

  // ── Access guard ───────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-red-600">shield</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Kirish taqiqlangan</h2>
          <p className="text-slate-500 text-sm mb-6">Bu sahifa faqat administratorlar uchun.</p>
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Foydalanuvchilar — BuFu Admin</title>
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
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c7c4d8; border-radius: 10px; }
      `}</style>

      <div className="flex min-h-screen bg-slate-50 font-sans">

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <aside className="h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-200 flex flex-col z-50 shadow-sm">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-slate-100">
            <span className="text-2xl font-black text-indigo-600 tracking-tight">BuFu</span>
            <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.id === 'users';
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 hover:translate-x-0.5'
                    }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User info + logout */}
          <div className="px-3 pb-4 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                {user.username?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">@{user.username}</p>
                <p className="text-xs text-slate-400">Bosh administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Chiqish</span>
            </button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────────────── */}
        <main className="ml-64 flex-1 flex flex-col min-h-screen">

          {/* Top header */}
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Foydalanuvchilar boshqaruvi</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Platformadagi barcha frilanserlar va mijozlarni nazorat qilish.
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Yangi foydalanuvchi
            </button>
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

          {/* Stats mini */}
          <div className="px-8 pt-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Umumiy foydalanuvchilar', value: stats?.totalUsers ?? allUsers.length, icon: 'group', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                { label: 'Frilanserlar', value: stats?.totalFreelancers ?? tabCounts[1], icon: 'engineering', bg: 'bg-violet-50', color: 'text-violet-600' },
                { label: 'Agentlar / Mijozlar', value: stats?.totalAgents ?? tabCounts[2], icon: 'shopping_bag', bg: 'bg-amber-50', color: 'text-amber-600' },
                { label: 'Spam', value: stats?.spammedUsers ?? tabCounts[3], icon: 'block', bg: 'bg-red-50', color: 'text-red-500' },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-outlined text-[22px] ${s.color}`}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{s.label}</p>
                    <p className="text-2xl font-extrabold text-slate-800">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Search + filter bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <div className="relative w-full lg:w-80">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                  placeholder="Ism yoki email bo'yicha qidirish..."
                  type="text"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Filter tabs */}
                {FILTER_TABS.map((label, i) => (
                  <button
                    key={label}
                    onClick={() => { setFilterTab(i); setPage(1); }}
                    className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                      filterTab === i
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label} ({tabCounts[i]})
                  </button>
                ))}
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white outline-none focus:border-indigo-400"
                >
                  <option value="">Barcha holat</option>
                  <option value="ACTIVE">Faol</option>
                  <option value="SPAM">Spam</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className={`flex gap-4 ${selectedUser ? 'items-start' : ''}`}>
              {/* Main table */}
              <div className={`flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm ${selectedUser ? 'max-w-none' : ''}`}>
                {usersLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Foydalanuvchi</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Qo'shilgan</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Holat</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amallar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paginatedUsers.map((u) => (
                            <tr
                              key={u._id}
                              onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)}
                              className={`transition-colors cursor-pointer ${
                                selectedUser?._id === u._id
                                  ? 'bg-indigo-50'
                                  : u.userStatus === UserStatus.SPAM
                                  ? 'bg-red-50/30 hover:bg-red-50/60'
                                  : 'hover:bg-slate-50/60'
                              }`}
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
                                    <p className="text-sm font-bold text-slate-800">{u.fullName ?? u.username}</p>
                                    <p className="text-xs text-slate-400">@{u.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{u.email ?? '—'}</td>
                              <td className="px-6 py-4">
                                {u.userType === UserType.ADMIN ? (
                                  <span className="px-2.5 py-1 bg-slate-800 text-white text-xs font-bold rounded-full">ADMIN</span>
                                ) : (
                                  <span
                                    className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                      u.userType === UserType.FREELANCER
                                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                        : 'bg-violet-50 text-violet-600 border border-violet-100'
                                    }`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {u.userType === UserType.FREELANCER ? 'Frilanser' : 'Agent'}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                                {u.createdAt
                                  ? new Date(Number(u.createdAt)).toISOString().slice(0, 10)
                                  : '—'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: STATUS_COLOR[u.userStatus] ?? '#94a3b8' }}
                                  />
                                  <span
                                    className="text-xs font-semibold"
                                    style={{ color: STATUS_COLOR[u.userStatus] ?? '#94a3b8' }}
                                  >
                                    {u.userStatus === 'ACTIVE'
                                      ? 'Faol'
                                      : u.userStatus === 'SPAM'
                                      ? 'Spam'
                                      : u.userStatus}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.userType !== UserType.ADMIN && (
                                    <>
                                      <button
                                        onClick={() =>
                                          setNotifDialog({ open: true, userId: u._id, username: u.username })
                                        }
                                        title="Xabar yuborish"
                                        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                      >
                                        <span className="material-symbols-outlined text-[18px]">notifications</span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          u.userStatus === UserStatus.SPAM
                                            ? confirmStatusChange(u._id, UserStatus.ACTIVE, '')
                                            : handleStatusChange(u._id, u.username, UserStatus.SPAM)
                                        }
                                        title={u.userStatus === UserStatus.SPAM ? "Faollashtirish" : "Spam belgilash"}
                                        className={`p-1.5 rounded-lg transition-colors ${
                                          u.userStatus === UserStatus.SPAM
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-amber-500 hover:bg-amber-50'
                                        }`}
                                      >
                                        <span className="material-symbols-outlined text-[18px]">
                                          {u.userStatus === UserStatus.SPAM ? 'lock_open' : 'block'}
                                        </span>
                                      </button>
                                      <button
                                        onClick={() =>
                                          setDeleteDialog({ open: true, userId: u._id, username: u.username })
                                        }
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
                          {paginatedUsers.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-400">
                                <span className="material-symbols-outlined text-4xl text-slate-200 block mb-2">
                                  search_off
                                </span>
                                Foydalanuvchi topilmadi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <span className="text-sm text-slate-400">
                        {baseFiltered.length} tadan {(page - 1) * PAGE_SIZE + 1}–
                        {Math.min(page * PAGE_SIZE, baseFiltered.length)} gacha
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                page === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {totalPages > 5 && (
                          <>
                            <span className="px-1 text-slate-400">...</span>
                            <button
                              onClick={() => setPage(totalPages)}
                              className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                                page === totalPages
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages || totalPages === 0}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User detail side panel */}
              {selectedUser && (
                <div className="w-72 bg-white border border-slate-200 rounded-2xl shadow-sm flex-shrink-0 overflow-hidden sticky top-24">
                  {/* Top gradient bar */}
                  <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg overflow-hidden flex-shrink-0">
                          {selectedUser.profileImage ? (
                            <img src={selectedUser.profileImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (selectedUser.fullName || selectedUser.username)?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{selectedUser.fullName ?? selectedUser.username}</p>
                          <p className="text-xs text-slate-400">@{selectedUser.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedUser(null)}
                        className="text-slate-300 hover:text-slate-600 flex-shrink-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span
                        className="px-2.5 py-1 text-xs font-bold rounded-full"
                        style={{
                          backgroundColor: `${STATUS_COLOR[selectedUser.userStatus] ?? '#94a3b8'}22`,
                          color: STATUS_COLOR[selectedUser.userStatus] ?? '#94a3b8',
                        }}
                      >
                        {selectedUser.userStatus === 'ACTIVE' ? 'Faol' : selectedUser.userStatus === 'SPAM' ? 'Spam' : selectedUser.userStatus}
                      </span>
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          selectedUser.userType === UserType.FREELANCER
                            ? 'bg-indigo-50 text-indigo-600'
                            : selectedUser.userType === UserType.ADMIN
                            ? 'bg-slate-800 text-white'
                            : 'bg-violet-50 text-violet-600'
                        }`}
                      >
                        {selectedUser.userType === UserType.FREELANCER
                          ? 'Frilanser'
                          : selectedUser.userType === UserType.AGENT
                          ? 'Agent'
                          : 'Admin'}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 mb-4">
                      {[
                        { label: 'Email', value: selectedUser.email ?? '—' },
                        { label: 'Telefon', value: selectedUser.phone ?? '—' },
                        {
                          label: "Qo'shilgan",
                          value: selectedUser.createdAt
                            ? new Date(Number(selectedUser.createdAt)).toISOString().slice(0, 10)
                            : '—',
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs text-slate-400">{item.label}</p>
                          <p className="text-sm font-medium text-slate-700 break-all">{item.value}</p>
                        </div>
                      ))}
                      {selectedUser.spamReason && (
                        <div>
                          <p className="text-xs text-amber-500 font-semibold">Spam sababi</p>
                          <p className="text-sm text-slate-600">{selectedUser.spamReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Role change */}
                    {selectedUser.userType !== UserType.ADMIN && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 mb-1.5">Rolni o'zgartirish</p>
                        <select
                          value={selectedUser.userType}
                          onChange={(e) => handleChangeRole(selectedUser._id, e.target.value as UserType)}
                          className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 outline-none focus:border-indigo-400"
                        >
                          <option value={UserType.FREELANCER}>Frilanser</option>
                          <option value={UserType.AGENT}>Agent</option>
                        </select>
                      </div>
                    )}

                    {/* Action buttons */}
                    {selectedUser.userType !== UserType.ADMIN && (
                      <div className="space-y-2">
                        <button
                          onClick={() =>
                            setNotifDialog({ open: true, userId: selectedUser._id, username: selectedUser.username })
                          }
                          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">notifications</span>
                          Xabar yuborish
                        </button>
                        {selectedUser.userStatus === UserStatus.SPAM ? (
                          <button
                            onClick={() => confirmStatusChange(selectedUser._id, UserStatus.ACTIVE, '')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">lock_open</span>
                            Faollashtirish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(selectedUser._id, selectedUser.username, UserStatus.SPAM)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-amber-600 border border-amber-200 rounded-xl hover:bg-amber-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[18px]">block</span>
                            Spam belgilash
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setDeleteDialog({ open: true, userId: selectedUser._id, username: selectedUser.username })
                          }
                          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          O'chirish
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="border-t border-slate-200 px-8 py-5 mt-auto bg-white/60">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="text-base font-black text-indigo-600">BuFu</span>
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
              <h3 className="text-base font-bold text-slate-800">Foydalanuvchini o'chirish</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              <strong>@{deleteDialog.username}</strong> foydalanuvchisini o'chirishni tasdiqlaysizmi?
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Bu amalni ortga qaytarib bo'lmaydi. Foydalanuvchi va barcha ma'lumotlari o'chiriladi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteDialog({ open: false, userId: '', username: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
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
              <h3 className="text-base font-bold text-slate-800">Spam: @{spamDialog.username}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Foydalanuvchi spam sababi bilan xabardor qilinadi va hisobi cheklanadi.
            </p>
            <textarea
              value={spamReason}
              onChange={(e) => setSpamReason(e.target.value)}
              placeholder="Masalan: Soxta ish e'lonlari joylash. Platforma qoidalarini ko'p marta buzish."
              rows={3}
              className="w-full text-sm border border-slate-200 rounded-xl p-3 outline-none focus:border-amber-400 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setSpamDialog({ open: false, userId: '', username: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
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

      {/* ── Modal: Send Notification ─────────────────────────────────── */}
      {notifDialog.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-indigo-600">notifications</span>
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  @{notifDialog.username} ga xabar
                </h3>
              </div>
              <button
                onClick={() => setNotifDialog({ open: false, userId: '', username: '' })}
                className="text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Bildirishnoma @{notifDialog.username} ning notification belliga tushadi.
            </p>
            <div className="space-y-3 mb-4">
              <input
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Sarlavha"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400"
              />
              <textarea
                value={notifBody}
                onChange={(e) => setNotifBody(e.target.value)}
                placeholder="Xabar matni..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-400 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNotifDialog({ open: false, userId: '', username: '' })}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
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
    </>
  );
};

export default UsersPage;
