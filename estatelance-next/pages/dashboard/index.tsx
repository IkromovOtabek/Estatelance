import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import {
  Briefcase, CurrencyDollar, PaperPlaneTilt, Star,
  ArrowUp, ArrowRight, Plus, Bell, ChartLineUp,
  CheckCircle, Clock, XCircle, Rocket
} from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_MY_JOBS, GET_MY_ANALYTICS } from '../../apollo/user/query';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../apollo/store';

type TabKey = 'all' | 'active' | 'pending' | 'completed';

const statuses: Record<string, { label: string; color: string; icon: React.ReactElement }> = {
  ACTIVE:    { label: 'Faol',        color: 'bg-emerald-50 text-emerald-700', icon: <CheckCircle size={12} weight="fill" /> },
  PENDING:   { label: 'Kutilmoqda', color: 'bg-amber-50 text-amber-700',    icon: <Clock size={12} weight="fill" /> },
  COMPLETED: { label: 'Tugagan',    color: 'bg-slate-100 text-slate-500',   icon: <CheckCircle size={12} weight="fill" /> },
  CANCELLED: { label: 'Bekor',      color: 'bg-red-50 text-red-600',        icon: <XCircle size={12} weight="fill" /> },
};

const DashboardPage = () => {
  const user = useReactiveVar(userVar);
  const [tab, setTab] = useState<TabKey>('all');

  const { data } = useQuery(GET_MY_JOBS, {
    fetchPolicy: 'cache-and-network',
  });

  const isFreelancer = user?.userType === 'FREELANCER';

  const { data: analyticsData } = useQuery(GET_MY_ANALYTICS, {
    skip: !isFreelancer,
    fetchPolicy: 'cache-and-network',
  });

  const jobs = data?.getMyJobs ?? [];
  const analytics = analyticsData?.getMyAnalytics;

  const activeJobs    = jobs.filter((j: any) => j.status === 'ACTIVE');
  const pendingJobs   = jobs.filter((j: any) => j.status === 'OPEN');
  const completedJobs = jobs.filter((j: any) => j.status === 'COMPLETED');

  const filteredJobs = tab === 'all'       ? jobs
    : tab === 'active'    ? activeJobs
    : tab === 'pending'   ? pendingJobs
    : completedJobs;

  const displayName = user?.fullName ?? user?.username ?? 'Foydalanuvchi';

  const STATS = isFreelancer && analytics ? [
    { label: 'Jami takliflar',     value: analytics.totalBids,                           icon: <PaperPlaneTilt size={22} color="#f59e0b" />, bg: 'bg-amber-50',   delta: '' },
    { label: 'Qabul qilingan',     value: analytics.acceptedBids,                        icon: <CheckCircle size={22} color="#10b981" />,    bg: 'bg-emerald-50', delta: '' },
    { label: 'Tugagan ishlar',     value: analytics.completedJobs,                       icon: <Star size={22} color="#818CF8" weight="fill" />, bg: 'bg-purple-50', delta: '' },
    { label: "Jami daromad ($)",   value: `$${analytics.totalEarned.toLocaleString()}`,  icon: <CurrencyDollar size={22} color="#4f46e5" />, bg: 'bg-indigo-50',  delta: '' },
  ] : [
    { label: 'Faol ishlar',        value: activeJobs.length,                             icon: <Briefcase size={22} color="#4f46e5" />,      bg: 'bg-indigo-50',  delta: '' },
    { label: "Kutilayotgan ishlar",value: pendingJobs.length,                            icon: <Clock size={22} color="#f59e0b" />,           bg: 'bg-amber-50',   delta: '' },
    { label: 'Tugagan ishlar',     value: completedJobs.length,                          icon: <Star size={22} color="#818CF8" weight="fill" />, bg: 'bg-purple-50', delta: '' },
    { label: "Jami ishlar",        value: jobs.length,                                   icon: <ChartLineUp size={22} color="#10b981" />,    bg: 'bg-emerald-50', delta: '' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard — BuFu</title>
        <meta name="description" content="BuFu shaxsiy boshqaruv paneli — faol ishlar, daromad va takliflar." />
      </Head>

      {/* Greeting */}
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Salom, {displayName}! 👋</h1>
          <p className="text-slate-500 mt-1 text-sm">Bu yerda barcha faoliyatingiz ko'rsatilgan.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/jobs" className="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
            <Bell size={16} /> Bildirishnomalar
          </Link>
          <Link href="/my-works/create" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors">
            <Plus size={16} /> Ish e'lon qilish
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                {s.icon}
              </div>
              {s.delta && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <ArrowUp size={10} /> {s.delta}
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: recent jobs */}
        <div className="lg:col-span-2">
          {/* Analytics for freelancers / Profile info for agents */}
          {isFreelancer && analytics ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
              <p className="text-sm font-bold text-slate-900 mb-4">Profil statistikasi</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-indigo-600">{analytics.profileViews}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Ko'rishlar</p>
                </div>
                <div className="text-center border-x border-slate-100">
                  <p className="text-xl font-extrabold text-amber-500">⭐ {analytics.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">O'rtacha reyting</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-extrabold text-emerald-600">{analytics.followerCount}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Obunachilar</p>
                </div>
              </div>
              {analytics.totalBids > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Qabul qilinish darajasi</span>
                    <span className="font-bold text-emerald-600">
                      {Math.round((analytics.acceptedBids / analytics.totalBids) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.round((analytics.acceptedBids / analytics.totalBids) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-slate-900">Jami ishlar</p>
                <span className="text-sm font-bold text-indigo-600">{jobs.length}</span>
              </div>
              <p className="text-xs text-slate-400">Barcha e'lon qilgan ishlaringiz</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto">
              {(['all', 'active', 'pending', 'completed'] as TabKey[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    tab === t ? 'text-indigo-600 border-indigo-600' : 'text-slate-500 border-transparent hover:text-slate-800'
                  }`}
                >
                  {t === 'all' ? 'Barchasi' : t === 'active' ? 'Faol' : t === 'pending' ? 'Kutilmoqda' : 'Tugagan'}
                  <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                    {t === 'all' ? jobs.length : t === 'active' ? activeJobs.length : t === 'pending' ? pendingJobs.length : completedJobs.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="divide-y divide-slate-100">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <Briefcase size={32} className="mx-auto mb-2 opacity-30" />
                  Ishlar topilmadi
                </div>
              ) : filteredJobs.slice(0, 6).map((job: any) => {
                const st = statuses[job.status] ?? statuses['PENDING'];
                return (
                  <div key={job._id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Briefcase size={18} color="#4f46e5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{job.bids?.length ?? 0} ta taklif</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                      <span className="text-sm font-bold text-indigo-600">${job.budget ?? 0}</span>
                      <Link href={`/jobs/${job._id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight size={16} color="#4f46e5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {jobs.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100">
                <Link href="/my-works" className="text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                  Barcha ishlarni ko'rish <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Quick links */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-sm font-bold text-slate-900 mb-3">Tezkor harakatlar</p>
            <div className="space-y-2">
              {[
                { href: '/my-works/create', icon: <Plus size={16} color="#4f46e5" />, label: 'Yangi ish e\'lon qilish', bg: 'bg-indigo-50' },
                { href: '/browse', icon: <Star size={16} color="#f59e0b" />, label: 'Frilanser topish', bg: 'bg-amber-50' },
                { href: '/pricing', icon: <Rocket size={16} color="#10b981" />, label: 'Boost olish', bg: 'bg-emerald-50' },
                { href: '/messages', icon: <PaperPlaneTilt size={16} color="#8b5cf6" />, label: 'Xabarlar', bg: 'bg-purple-50' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                  <ArrowRight size={14} color="#94a3b8" className="ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          {/* Analytics teaser */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
            <ChartLineUp size={28} color="white" weight="fill" className="mb-3" />
            <h4 className="font-bold text-base mb-1">Ko'proq ko'rinish oling</h4>
            <p className="text-sm text-white/80 mb-4">Premium boost bilan e'lonlaringizni ko'proq odamlarga yetkazing.</p>
            <Link href="/pricing" className="block text-center bg-white text-indigo-700 text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
              Boost narxlari
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(DashboardPage);
