import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery, useMutation } from '@apollo/client';
import {
  Plus, MagnifyingGlass, Briefcase, Users, CheckCircle, Clock,
  Rocket, Pencil, Trash, ArrowRight, ChartBar, Wallet, XCircle
} from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { GET_MY_JOBS } from '../../apollo/user/query';
import { DELETE_JOB } from '../../apollo/user/mutation';

type FilterTab = 'all' | 'active' | 'pending' | 'completed' | 'cancelled';

const statusMeta: Record<string, { label: string; color: string; dot: string }> = {
  ACTIVE:    { label: 'Faol',        color: 'bg-emerald-50 text-emerald-700',  dot: 'bg-emerald-500' },
  PENDING:   { label: 'Kutilmoqda', color: 'bg-amber-50 text-amber-700',     dot: 'bg-amber-400' },
  COMPLETED: { label: 'Tugagan',    color: 'bg-slate-100 text-slate-500',    dot: 'bg-slate-400' },
  CANCELLED: { label: 'Bekor',      color: 'bg-red-50 text-red-600',         dot: 'bg-red-400' },
};

const MyJobsPage = () => {
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, refetch } = useQuery(GET_MY_JOBS, {
    variables: { input: { page: 1, limit: 50 } },
    fetchPolicy: 'cache-and-network',
  });

  const [deleteJob] = useMutation(DELETE_JOB, {
    onCompleted: () => { refetch(); setDeleteConfirm(null); },
  });

  const allJobs = data?.getMyJobs ?? [];

  const filtered = allJobs.filter((j: any) => {
    if (tab === 'active'    && j.status !== 'ACTIVE')    return false;
    if (tab === 'pending'   && j.status !== 'PENDING')   return false;
    if (tab === 'completed' && j.status !== 'COMPLETED') return false;
    if (tab === 'cancelled' && j.status !== 'CANCELLED') return false;
    if (search && !j.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const countOf = (s: string) => allJobs.filter((j: any) => j.status === s).length;
  const totalBids = allJobs.reduce((sum: number, j: any) => sum + (j.bids?.length ?? 0), 0);

  return (
    <>
      <Head>
        <title>Mening e'lonlarim — BuFu</title>
        <meta name="description" content="BuFu platformasidagi barcha loyihalaringiz boshqaruvi." />
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mening e'lonlarim</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platformadagi barcha loyihalaringiz boshqaruvi</p>
        </div>
        <Link
          href="/my-works/create"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Yangi ish e'lon qilish
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Jami e'lonlar",     value: allJobs.length,  icon: <Briefcase size={20} color="#4f46e5" />, bg: 'bg-indigo-50' },
          { label: 'Jami takliflar',    value: totalBids,       icon: <Users size={20} color="#10b981" />,    bg: 'bg-emerald-50' },
          { label: 'Faol ishlar',       value: countOf('ACTIVE'), icon: <CheckCircle size={20} color="#f59e0b" weight="fill" />, bg: 'bg-amber-50' },
          { label: 'Tugagan',           value: countOf('COMPLETED'), icon: <ChartBar size={20} color="#8b5cf6" />, bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + search */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 gap-3 flex-wrap">
          <div className="flex border-b border-slate-100 overflow-x-auto -mb-px">
            {([
              { key: 'all',       label: 'Barchasi',    count: allJobs.length },
              { key: 'active',    label: 'Faol',        count: countOf('ACTIVE') },
              { key: 'pending',   label: 'Kutilmoqda',  count: countOf('PENDING') },
              { key: 'completed', label: 'Tugagan',     count: countOf('COMPLETED') },
              { key: 'cancelled', label: 'Bekor',       count: countOf('CANCELLED') },
            ] as { key: FilterTab; label: string; count: number }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.key
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{t.count}</span>
              </button>
            ))}
          </div>
          <div className="relative mb-1">
            <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white w-48"
            />
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Briefcase size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">E'lonlar topilmadi</p>
              <Link href="/my-works/create" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline font-semibold">
                <Plus size={14} /> Yangi e'lon qo'shish
              </Link>
            </div>
          ) : filtered.map((job: any) => {
            const st = statusMeta[job.status] ?? statusMeta['PENDING'];
            return (
              <div key={job._id} className="flex flex-col md:flex-row md:items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Briefcase size={18} color="#4f46e5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${st.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {job.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} /> {job.createdAt ? new Date(job.createdAt).toLocaleDateString('uz-UZ') : '—'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Users size={11} /> {job.bids?.length ?? 0} ta taklif
                    </span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Wallet size={11} /> ${job.budget ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/jobs/${job._id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <ArrowRight size={14} /> Ko'rish
                  </Link>
                  <Link
                    href={`/my-works?edit=${job._id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-600 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    <Pencil size={14} /> Tahrirlash
                  </Link>
                  <Link
                    href={`/pricing?job=${job._id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Rocket size={14} /> Boost
                  </Link>
                  {deleteConfirm === job._id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteJob({ variables: { jobId: job._id } })}
                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Ha, o'chir
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        Bekor
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(job._id)}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(MyJobsPage);
