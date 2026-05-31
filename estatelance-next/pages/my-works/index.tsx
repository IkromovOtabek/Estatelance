import React, { useState } from 'react';
import BoostModal from '../../libs/components/common/BoostModal';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { GET_MY_JOBS } from '../../apollo/user/query';
import { COMPLETE_JOB, DELETE_JOB, UPDATE_JOB, BOOST_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Job } from '../../libs/types';
import { JobCategory, JOB_CATEGORY_LABELS, JobStatus } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

// ── Status config ─────────────────────────────────────────────────────────────
type StatusCfg = {
  label: string;
  badgeClass: string;
  dotClass: string;
};

const STATUS_CONFIG: Record<string, StatusCfg> = {
  OPEN:      { label: 'Ochiq',    badgeClass: 'bg-indigo-100 text-indigo-700',  dotClass: 'bg-indigo-500' },
  ACTIVE:    { label: 'Faol',     badgeClass: 'bg-green-100 text-green-700',    dotClass: 'bg-green-500' },
  COMPLETED: { label: 'Tugagan',  badgeClass: 'bg-slate-100 text-slate-600',    dotClass: 'bg-slate-400' },
  CANCELLED: { label: 'Bekor',    badgeClass: 'bg-red-100 text-red-700',        dotClass: 'bg-red-500' },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const ms =
    typeof dateStr === 'string' && /^\d+$/.test(dateStr)
      ? parseInt(dateStr)
      : new Date(dateStr).getTime();
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

// ── Edit Modal (pure Tailwind) ────────────────────────────────────────────────
interface EditModalProps {
  open: boolean;
  saving: boolean;
  title: string;
  description: string;
  budget: string;
  onTitle: (v: string) => void;
  onDescription: (v: string) => void;
  onBudget: (v: string) => void;
  onClose: () => void;
  onSave: () => void;
}

function EditModal({
  open, saving, title, description, budget,
  onTitle, onDescription, onBudget, onClose, onSave,
}: EditModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Ishni tahrirlash</h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Sarlavha</label>
            <input
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              value={title}
              onChange={e => onTitle(e.target.value)}
              placeholder="Ish sarlavhasi..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tavsif</label>
            <textarea
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all resize-none"
              rows={4}
              value={description}
              onChange={e => onDescription(e.target.value)}
              placeholder="Ish haqida batafsil..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Byudjet ($)</label>
            <input
              type="number"
              min={10}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
              value={budget}
              onChange={e => onBudget(e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            onClick={onSave}
            disabled={saving || !title.trim() || !description.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Saqlanmoqda...
              </>
            ) : 'Saqlash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const MyWorksPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  const [filterStatus, setFilterStatus] = useState<string>('');

  // Boost modal state
  const [boostJob2, setBoostJob2] = useState<Job | null>(null);

  // Edit modal state
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const { data, loading, refetch } = useQuery(GET_MY_JOBS, {
    skip: !user._id,
    fetchPolicy: 'cache-and-network',
  });

  const [completeJob] = useMutation(COMPLETE_JOB);
  const [deleteJob] = useMutation(DELETE_JOB);
  const [updateJob] = useMutation(UPDATE_JOB);
  const [boostJob] = useMutation(BOOST_JOB);

  const allJobs: Job[] = data?.getMyJobs ?? [];
  const jobs = filterStatus ? allJobs.filter(j => j.status === filterStatus) : allJobs;

  // Stats
  const stats = {
    total:      allJobs.length,
    open:       allJobs.filter(j => j.status === JobStatus.OPEN).length,
    active:     allJobs.filter(j => j.status === JobStatus.ACTIVE).length,
    completed:  allJobs.filter(j => j.status === JobStatus.COMPLETED).length,
    cancelled:  allJobs.filter(j => j.status === JobStatus.CANCELLED).length,
    totalBudget: allJobs.reduce((s, j) => s + (j.budget ?? 0), 0),
    totalBids:  allJobs.reduce((s, j) => s + (j.bidCount ?? 0), 0),
  };

  const handleComplete = async (jobId: string) => {
    if (!window.confirm('Ishni bajarilgan deb belgilaysizmi?')) return;
    try { await completeJob({ variables: { jobId } }); refetch(); } catch {}
  };

  const handleDelete = async (job: Job) => {
    if (!window.confirm(`"${job.title}" ishini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteJob({ variables: { jobId: job._id } });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message ?? 'O\'chirishda xato');
    }
  };

  const handleBoost = (job: Job) => setBoostJob2(job);

  const handleBoostConfirm = async (plan: string) => {
    if (!boostJob2) return;
    try {
      await boostJob({ variables: { jobId: boostJob2._id, plan } });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message ?? 'Boost da xato');
      throw err;
    }
  };

  const openEdit = (job: Job) => {
    setEditJob(job);
    setEditTitle(job.title);
    setEditDescription(job.description);
    setEditBudget(String(job.budget));
  };

  const handleEditSave = async () => {
    if (!editJob) return;
    setEditSaving(true);
    try {
      await updateJob({
        variables: {
          jobId: editJob._id,
          input: {
            title: editTitle.trim(),
            description: editDescription.trim(),
            budget: parseFloat(editBudget) || editJob.budget,
          },
        },
      });
      refetch();
      setEditJob(null);
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message ?? 'Saqlashda xato');
    } finally {
      setEditSaving(false);
    }
  };

  // Access guard
  if (!user._id) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-base font-bold text-slate-700 mb-1">Kirish talab etiladi</p>
        <p className="text-sm text-slate-400 mb-4">Ish e'lonlaringizni ko'rish uchun tizimga kiring.</p>
        <button
          onClick={() => router.push('/account')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Kirish
        </button>
      </div>
    );
  }

  const TABS = [
    { value: '',           label: 'Barchasi',   count: stats.total },
    { value: 'ACTIVE',     label: 'Faol',       count: stats.active },
    { value: 'OPEN',       label: 'Kutilmoqda', count: stats.open },
    { value: 'COMPLETED',  label: 'Tugagan',    count: stats.completed },
    { value: 'CANCELLED',  label: 'Bekor',      count: stats.cancelled },
  ];

  return (
    <>
      <Head><title>Mening ishlarim — BuFu</title></Head>

      {/* ── Boost Modal ───────────────────────────────────────────────── */}
      <BoostModal
        open={!!boostJob2}
        jobTitle={boostJob2?.title ?? ''}
        onClose={() => setBoostJob2(null)}
        onConfirm={handleBoostConfirm}
      />

      {/* ── Edit Modal ────────────────────────────────────────────────── */}
      <EditModal
        open={!!editJob}
        saving={editSaving}
        title={editTitle}
        description={editDescription}
        budget={editBudget}
        onTitle={setEditTitle}
        onDescription={setEditDescription}
        onBudget={setEditBudget}
        onClose={() => !editSaving && setEditJob(null)}
        onSave={handleEditSave}
      />

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Mening ishlarim</h1>
          <p className="text-sm text-slate-500 mt-0.5">Platformadagi barcha ish e'lonlaringiz boshqaruvi</p>
        </div>
        <button
          onClick={() => router.push('/my-works/create')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Yangi ish e'lon qilish
        </button>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        {/* Total jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Jami</span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami e'lonlar</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>

        {/* Total bids */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">+{stats.totalBids}</span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jami takliflar</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.totalBids}</p>
        </div>

        {/* Active jobs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Faol</span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Faol ishlar</p>
          <p className="text-3xl font-black text-slate-900 mt-1">{stats.active}</p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0 border-b border-slate-200 mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`flex items-center gap-1.5 pb-3 px-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              filterStatus === tab.value
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            {tab.label}
            <span
              className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                filterStatus === tab.value
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      ) : jobs.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200 text-center px-6">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-700">
            {filterStatus ? 'Bu holatda ish yo\'q' : 'Hozircha e\'lonlar yo\'q'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xs">
            {filterStatus
              ? 'Boshqa filterni tanlang yoki yangi ish e\'lon qiling.'
              : 'Birinchi loyihangizni e\'lon qiling va malakali freelancerlarni toping!'}
          </p>
          {!filterStatus && (
            <button
              onClick={() => router.push('/my-works/create')}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Ish e'lon qilish
            </button>
          )}
        </div>
      ) : (
        /* Job list */
        <div className="space-y-4">
          {jobs.map(job => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;
            const isBoosted = !!job.boostExpiresAt && new Date(job.boostExpiresAt).getTime() > Date.now();
            const canEdit   = job.status === JobStatus.OPEN;
            const canDelete = job.status !== JobStatus.ACTIVE;
            const canBoost  = job.status === JobStatus.OPEN;

            const boostBorderClass = job.boostPlan === 'VIP'
              ? 'border-amber-400'
              : job.boostPlan === 'PRO'
              ? 'border-violet-400'
              : 'border-indigo-400';

            return (
              <div
                key={job._id}
                className={`bg-white rounded-2xl border p-5 md:p-6 hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                  isBoosted ? `border-2 ${boostBorderClass}` : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${cfg.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                      {cfg.label}
                    </span>

                    {job.category && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                        {JOB_CATEGORY_LABELS[job.category as JobCategory] ?? job.category}
                      </span>
                    )}

                    {isBoosted && (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                        job.boostPlan === 'VIP'
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : job.boostPlan === 'PRO'
                          ? 'bg-violet-50 text-violet-600 border border-violet-200'
                          : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                      }`}>
                        🚀 {job.boostPlan === 'VIP' ? '⭐ VIP Top' : job.boostPlan === 'PRO' ? '⚡ Pro Top' : 'Top'}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {timeAgo(job.createdAt)}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate mb-1">
                    {job.title}
                  </h4>

                  {/* Description */}
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {job.description}
                  </p>

                  {/* Meta: budget + bids */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full">
                      <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-bold text-indigo-700">${job.budget}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm">{job.bidCount ?? 0} ta taklif</span>
                    </div>
                  </div>
                </div>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* View detail */}
                  <Link href={`/jobs/${job._id}`}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer">
                      Ko'rish
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>

                  {/* Boost */}
                  {canBoost && (
                    <button
                      onClick={() => handleBoost(job)}
                      title="Top ga chiqazish"
                      className="p-2.5 text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-xl transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.5C6.5 9 5 13 5 16a7 7 0 0014 0c0-3-1.5-7-7-13.5zM12 21a5 5 0 01-5-5c0-2.5 1.5-6 5-11.5C15.5 10 17 13.5 17 16a5 5 0 01-5 5z"/>
                      </svg>
                    </button>
                  )}

                  {/* Edit */}
                  {canEdit && (
                    <button
                      onClick={() => openEdit(job)}
                      title="Tahrirlash"
                      className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}

                  {/* Mark complete */}
                  {job.status === JobStatus.ACTIVE && (
                    <button
                      onClick={() => handleComplete(job._id)}
                      title="Bajarildi deb belgilash"
                      className="p-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(job)}
                      title="O'chirish"
                      className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => router.push('/my-works/create')}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-transform z-50"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </>
  );
};

export default withLayoutBasic(MyWorksPage);
