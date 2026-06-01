import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useReactiveVar, useQuery, useMutation } from '@apollo/client';
import { GET_JOBS } from '../../apollo/user/query';
import { SEND_MESSAGE, INCREMENT_JOB_VIEW } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Job } from '../../libs/types';
import {
  JobCategory, JOB_CATEGORY_LABELS,
  JobStatus, UserType,
} from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const ms = /^\d+$/.test(dateStr) ? parseInt(dateStr) : new Date(dateStr).getTime();
  if (isNaN(ms)) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

const EXP_LABELS: Record<string, string> = {
  NONE:   'Tajriba kerak emas',
  JUNIOR: '1–3 yil',
  MIDDLE: '3–6 yil',
  SENIOR: '6 yildan ortiq',
};
const FORMAT_LABELS: Record<string, string> = {
  ONSITE:    'Ish joyida',
  REMOTE:    'Masofaviy',
  HYBRID:    'Gibrid',
  TRAVELING: 'Sayohat',
};

const SORT_OPTIONS = [
  { val: 'new',    label: 'Yangi' },
  { val: 'popular',label: 'Mashhur' },
  { val: 'high',   label: 'Budjet yuqori' },
  { val: 'low',    label: 'Budjet past' },
];


const BOOST_BADGES: { label: string; bg: string; text: string }[] = [
  { label: 'TOP', bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { label: 'PRO', bg: 'bg-purple-100', text: 'text-purple-700' },
  { label: 'VIP', bg: 'bg-amber-100',  text: 'text-amber-700'  },
];

function getBoostBadge(idx: number) {
  // For demo: every 5th card gets a boost badge based on index
  if (idx % 7 === 0) return BOOST_BADGES[0];
  if (idx % 7 === 3) return BOOST_BADGES[1];
  if (idx % 7 === 5) return BOOST_BADGES[2];
  return null;
}

const ITEMS_PER_PAGE = 12;

// ─── Jobs Page ────────────────────────────────────────────────────────────────

const JobsPage = () => {
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { resolvedTheme } = useTheme();
  const isDark = mounted && resolvedTheme === 'dark';
  const isFreelancer = mounted && user.userType === UserType.FREELANCER;
  const isAgent      = mounted && user.userType === UserType.AGENT;

  // Filters
  const [searchInput, setSearchInput]       = useState('');
  const [search, setSearch]                 = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [budgetMax, setBudgetMax]           = useState(5000);
  const [expLevels, setExpLevels]           = useState<string[]>([]);
  const [jobTypes, setJobTypes]             = useState<string[]>([]);
  const [formats, setFormats]               = useState<string[]>([]);
  const [sortBy, setSortBy]                 = useState('new');
  const [page, setPage]                     = useState(1);

  // Modals
  const [contactJob, setContactJob]     = useState<Job | null>(null);
  const [requestJob, setRequestJob]     = useState<Job | null>(null);
  const [requestText, setRequestText]   = useState('');
  const [snackMsg, setSnackMsg]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [incrementJobView] = useMutation(INCREMENT_JOB_VIEW);

  // Auto-dismiss snack
  useEffect(() => {
    if (!snackMsg) return;
    const t = setTimeout(() => setSnackMsg(null), 4000);
    return () => clearTimeout(t);
  }, [snackMsg]);

  const buildRequestText = (job: Job) =>
    `Salom! "${job.title}" e'loningizni ko'rdim va ushbu loyihada ishlashni xohlayman.\n\n` +
    `📋 E'lon: ${job.title}\n` +
    `💰 Byudjet: $${job.budget}\n` +
    (job.location ? `📍 Joylashuv: ${job.location}\n` : '') +
    `\nMen ushbu loyiha uchun zarur ko'nikma va tajribaga egaman. Batafsil gaplashishga tayyorman. Iltimos, bog'laning!`;

  const openRequestModal = (job: Job) => {
    setRequestJob(job);
    setRequestText(buildRequestText(job));
  };

  const handleSendRequest = async () => {
    if (!requestJob || !requestText.trim()) return;
    if (!user._id) {
      setSnackMsg({ msg: 'Avval tizimga kiring!', type: 'error' });
      return;
    }
    if (user._id === requestJob.agentId) {
      setSnackMsg({ msg: "O'z e'loningizga so'rov yubora olmaysiz!", type: 'error' });
      return;
    }
    if (!requestJob.agentId) {
      setSnackMsg({ msg: 'Ish egasi topilmadi!', type: 'error' });
      return;
    }
    try {
      await sendMessage({
        variables: { input: { receiverId: requestJob.agentId, text: requestText.trim() } },
      });
      setSnackMsg({ msg: `"${requestJob.title}" uchun so'rov yuborildi!`, type: 'success' });
      setRequestJob(null);
    } catch (err: any) {
      const gqlCode = err?.graphQLErrors?.[0]?.extensions?.code ?? '';
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Noma'lum xatolik";
      if (gqlCode === 'FORBIDDEN' || msg.includes('Forbidden') || msg.includes('Unauthorized') || msg.includes('jwt')) {
        setSnackMsg({ msg: 'Tizimga kirish kerak yoki sessiyangiz tugagan. Qayta kiring.', type: 'error' });
      } else if (msg.includes('SPAM_RESTRICTED')) {
        setSnackMsg({ msg: "Hisobingiz cheklangan. So'rov yuborib bo'lmaydi.", type: 'error' });
      } else if (msg.includes('not found') || msg.includes('Not Found')) {
        setSnackMsg({ msg: 'Foydalanuvchi topilmadi.', type: 'error' });
      } else if (err?.networkError) {
        setSnackMsg({ msg: 'Tarmoq xatosi. Internet aloqasini tekshiring.', type: 'error' });
      } else {
        setSnackMsg({ msg: `Xatolik: ${msg}`, type: 'error' });
      }
    }
  };

  const { data, loading } = useQuery(GET_JOBS, {
    variables: {
      input: {
        page: 1, limit: 200,
        category: filterCategory || undefined,
        status: JobStatus.OPEN,
        searchText: search || undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });
  const allJobs: Job[] = data?.getJobs ?? [];

  // Client-side filtering + sorting
  const filteredJobs = useMemo(() => {
    let result = allJobs.filter(j => {
      if (budgetMax < 5000 && (j.budget ?? 0) > budgetMax) return false;
      if (expLevels.length && j.experienceLevel && !expLevels.includes(j.experienceLevel)) return false;
      if (jobTypes.length && j.jobType && !jobTypes.includes(j.jobType)) return false;
      if (formats.length && j.workFormat?.length) {
        if (!j.workFormat.some((f: string) => formats.includes(f))) return false;
      }
      return true;
    });

    switch (sortBy) {
      case 'high':    result = [...result].sort((a, b) => (b.budget ?? 0) - (a.budget ?? 0)); break;
      case 'low':     result = [...result].sort((a, b) => (a.budget ?? 0) - (b.budget ?? 0)); break;
      case 'popular': result = [...result].sort((a, b) => (b.bidCount ?? 0) - (a.bidCount ?? 0)); break;
      default:        result = [...result].sort((a, b) => {
        const ta = /^\d+$/.test(a.createdAt ?? '') ? parseInt(a.createdAt!) : new Date(a.createdAt ?? 0).getTime();
        const tb = /^\d+$/.test(b.createdAt ?? '') ? parseInt(b.createdAt!) : new Date(b.createdAt ?? 0).getTime();
        return tb - ta;
      });
    }
    return result;
  }, [allJobs, budgetMax, expLevels, jobTypes, formats, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / ITEMS_PER_PAGE));
  const pagedJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const resetFilters = () => {
    setSearch(''); setSearchInput('');
    setFilterCategory(''); setBudgetMax(5000);
    setExpLevels([]); setJobTypes([]); setFormats([]);
    setPage(1);
  };

  const hasFilters = !!(search || filterCategory || budgetMax < 5000 ||
    expLevels.length || jobTypes.length || formats.length);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const goPage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Pagination range helper
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <>
      <Head>
        <title>Ish e'lonlari — BuFu | O'zbekiston frilanserlar uchun ishlar</title>
        <meta name="description" content="O'zbekistondagi frilanser ishlar. IT, dizayn, foto, 3D render, marketing va boshqa sohalarda ish toping. BuFu — frilanserlar platformasi." />
        <meta name="keywords" content="ish elonlari, frilanser ish, IT ish, dizayn ish, Toshkent ish, O'zbekiston freelance, remote ish" />
        <link rel="canonical" href="https://bufu.uz/jobs" />
      </Head>

      {/* ── Sticky search header ─────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-md border-b -mx-6 px-6 py-3 mb-8"
        style={{
          backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.92)',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          boxShadow: isDark ? '0 1px 8px rgba(0,0,0,0.5)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Kasb, lavozim yoki kalit so'z..."
              className="w-full h-11 pl-12 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                color: isDark ? '#f1f5f9' : '#0f172a',
              }}
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-sm font-bold transition-all"
          >
            Qidirish
          </button>
        </div>
      </div>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-extrabold leading-tight mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Keyingi ishingizni toping
          </h1>
          <p className={`text-base ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            O'zbekistonning eng yaxshi frilanserlarini premium mahalliy va xalqaro imkoniyatlar bilan bog'laymiz.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg shrink-0" style={{ color: isDark ? '#94a3b8' : '#64748b', backgroundColor: isDark ? '#1e293b' : '#f8fafc', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span className="text-xs font-semibold">
            {loading ? '...' : `${filteredJobs.length} ta ish mavjud`}
          </span>
        </div>
      </div>

      {/* ── Mobile category chips ──────────────────────────────────────────── */}
      <div className="flex lg:hidden gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {[{ val: '', label: 'Hammasi' }, ...Object.values(JobCategory).map(c => ({ val: c, label: JOB_CATEGORY_LABELS[c] }))].map(c => (
          <button
            key={c.val}
            onClick={() => { setFilterCategory(c.val); setPage(1); }}
            className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
              filterCategory === c.val
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 items-start">

        {/* ════ LEFT SIDEBAR ════ */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <div className="rounded-xl p-5" style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05)' }}>

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.553.894l-4 2A1 1 0 016 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">Filtrlar</span>
              </div>
              {hasFilters && (
                <button onClick={resetFilters} className="text-xs text-indigo-600 hover:underline font-semibold">
                  Tozalash
                </button>
              )}
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Category */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Kategoriya</p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="category"
                    checked={filterCategory === ''}
                    onChange={() => { setFilterCategory(''); setPage(1); }}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">Hammasi</span>
                </label>
                {Object.values(JobCategory).map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={filterCategory === cat}
                      onChange={() => { setFilterCategory(cat); setPage(1); }}
                      className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                      <span className="opacity-60">{getCatIcon(cat, 13)}</span>
                      {JOB_CATEGORY_LABELS[cat]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Budget Range */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Byudjet ($ gacha)
              </p>
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={budgetMax}
                onChange={e => { setBudgetMax(Number(e.target.value)); setPage(1); }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>$0</span>
                <span className="font-semibold text-indigo-600">{budgetMax >= 5000 ? '$5000+' : `$${budgetMax}`}</span>
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Experience Level */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Tajriba darajasi</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { val: 'NONE',   label: 'Boshlang\'ich' },
                  { val: 'JUNIOR', label: 'Junior' },
                  { val: 'MIDDLE', label: 'Middle' },
                  { val: 'SENIOR', label: 'Senior' },
                ].map(o => (
                  <button
                    key={o.val}
                    onClick={() => { toggleArr(expLevels, setExpLevels, o.val); setPage(1); }}
                    className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                      expLevels.includes(o.val)
                        ? 'border-2 border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Job Type */}
            <div className="mb-6">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Bandlik turi</p>
              <div className="space-y-2">
                {[
                  { val: 'PERMANENT', label: 'Doimiy' },
                  { val: 'TEMPORARY', label: 'Vaqtinchalik' },
                ].map(o => (
                  <label key={o.val} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={jobTypes.includes(o.val)}
                      onChange={() => { toggleArr(jobTypes, setJobTypes, o.val); setPage(1); }}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{o.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100 mb-5" />

            {/* Work Format */}
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Ish formati</p>
              <div className="space-y-2">
                {Object.entries(FORMAT_LABELS).map(([val, label]) => (
                  <label key={val} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formats.includes(val)}
                      onChange={() => { toggleArr(formats, setFormats, val); setPage(1); }}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* ════ MAIN CONTENT ════ */}
        <div className="lg:col-span-9 min-w-0">

          {/* Sort + count bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <p className="text-sm text-slate-500">
              <span className="font-bold text-slate-900">{filteredJobs.length}</span> ta ish topildi
              {search && <> «{search}»</>}
              {filterCategory && (
                <span className="text-indigo-600 ml-1">
                  • {JOB_CATEGORY_LABELS[filterCategory as JobCategory]}
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium shrink-0">Saralash:</span>
              <div className="flex gap-1.5">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => { setSortBy(opt.val); setPage(1); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      sortBy === opt.val
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Skeleton loader */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-5 animate-pulse"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}` }}>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex-shrink-0" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 rounded-lg w-2/3" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                      <div className="h-3 rounded-lg w-full" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                      <div className="h-3 rounded-lg w-4/5" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                      <div className="flex gap-2 pt-1">
                        <div className="h-5 w-16 rounded-full" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                        <div className="h-5 w-20 rounded-full" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                        <div className="h-5 w-14 rounded-full" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                      </div>
                    </div>
                    <div className="w-24 h-8 rounded-xl flex-shrink-0" style={{ backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && filteredJobs.length === 0 && (
            <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
              <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-bold text-slate-600 mb-1">Ish topilmadi</p>
              <p className="text-sm text-slate-400 mb-4">Boshqa filter yoki kalit so'z sinab ko'ring</p>
              {hasFilters && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors"
                >
                  Filtrlarni tozalash
                </button>
              )}
            </div>
          )}

          {/* Job Cards */}
          {!loading && pagedJobs.length > 0 && (
            <div className="space-y-4">
              {pagedJobs.map((job, idx) => {
                const globalIdx = (page - 1) * ITEMS_PER_PAGE + idx;
                const boost = getBoostBadge(globalIdx);
                const viewers = job.viewCount ?? 0;
                const isOwn = isAgent && user._id === job.agentId;
                const salary = job.salaryFrom && job.salaryTo
                  ? `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`
                  : job.salaryFrom
                  ? `$${job.salaryFrom.toLocaleString()} dan`
                  : job.salaryTo
                  ? `$${job.salaryTo.toLocaleString()} gacha`
                  : job.budget === 0
                  ? 'Kelishiladi'
                  : job.budget
                  ? `$${job.budget.toLocaleString()}`
                  : null;

                return (
                  <div
                    key={job._id}
                    className="group bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-indigo-400 transition-all duration-200 relative overflow-hidden"
                  >
                    {/* Top row */}
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Category icon */}
                        <div className="w-11 h-11 shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                          {getCatIcon(job.category, 20)}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/jobs/${job._id}`} className="no-underline">
                            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 cursor-pointer">
                              {job.title}
                            </h2>
                          </Link>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {job.location && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                </svg>
                                {job.location}
                              </span>
                            )}
                            <span className="text-xs text-slate-400">{timeAgo(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right column */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {boost ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded tracking-widest ${boost.bg} ${boost.text}`}>
                            {boost.label}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded tracking-widest bg-emerald-50 text-emerald-600">
                            OCHIQ
                          </span>
                        )}
                        {salary && (
                          salary === 'Kelishiladi' ? (
                            <span className="flex items-center gap-1 text-sm font-bold whitespace-nowrap" style={{ color: '#22c55e' }}>
                              <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="2 6 5 9 10 3"/>
                              </svg>
                              Kelishiladi
                            </span>
                          ) : (
                            <span className="text-base font-bold text-indigo-600 whitespace-nowrap">
                              {salary}
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {job.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.experienceLevel && (
                        <span className="px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 font-medium">
                          {EXP_LABELS[job.experienceLevel] ?? job.experienceLevel}
                        </span>
                      )}
                      {job.jobType && (
                        <span className="px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 font-medium">
                          {job.jobType === 'PERMANENT' ? 'Doimiy' : 'Vaqtinchalik'}
                        </span>
                      )}
                      {(Array.isArray(job.workFormat) ? job.workFormat : job.workFormat ? [job.workFormat] : []).map((f: string) => (
                        <span key={f} className="px-2.5 py-1 bg-slate-50 rounded-full text-xs text-slate-500 font-medium">
                          {FORMAT_LABELS[f] ?? f}
                        </span>
                      ))}
                      <span className="px-2.5 py-1 bg-indigo-50 rounded-full text-xs text-indigo-600 font-semibold">
                        {JOB_CATEGORY_LABELS[job.category as JobCategory]}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        {/* Agent */}
                        {job.agentId && (
                          <Link href={`/profile/${job.agentId}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors no-underline">
                            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-200">
                              {job.agentName?.[0]?.toUpperCase() ?? 'A'}
                            </div>
                            <span className="font-semibold text-slate-600 hover:text-indigo-600">{job.agentName ?? 'Agent'}</span>
                          </Link>
                        )}
                        {/* Bids */}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.bidCount ?? 0} ta taklif
                        </span>
                        {/* Viewers */}
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {viewers}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {isOwn ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-semibold">
                            Sizning ishingiz
                          </span>
                        ) : isFreelancer ? (
                          <>
                            <Link href={`/jobs/${job._id}`} className="no-underline">
                              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95">
                                Murojaat
                              </button>
                            </Link>
                            <button
                              onClick={() => openRequestModal(job)}
                              className="px-3 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-all flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                              </svg>
                              So'rov
                            </button>
                            <button
                              onClick={() => setContactJob(job)}
                              className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                              Aloqa
                            </button>
                          </>
                        ) : (
                          <>
                            <Link
                              href={`/jobs/${job._id}`}
                              className="no-underline"
                              onClick={() => {
                                if (user._id) incrementJobView({ variables: { jobId: job._id } });
                              }}
                            >
                              <button className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all flex items-center gap-1">
                                Ko&apos;rish
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </Link>
                            <button
                              onClick={() => openRequestModal(job)}
                              className="px-3 py-2 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-50 transition-all flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                              </svg>
                              So'rov
                            </button>
                            <button
                              onClick={() => setContactJob(job)}
                              className="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-xs font-semibold hover:border-indigo-300 hover:text-indigo-600 transition-all"
                            >
                              Aloqa
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <button
                onClick={() => goPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {pageNumbers.map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-400 select-none">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goPage(p as number)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                      page === p
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => goPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ════ So'rov yuborish Modal ════ */}
      {requestJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                  <span className="text-white font-bold text-sm">So'rov jo'natish</span>
                </div>
                <p className="text-white/70 text-xs truncate max-w-xs">{requestJob.title}</p>
              </div>
              <button
                onClick={() => !sending && setRequestJob(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Job info strip */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-4 text-xs text-slate-500">
              <span className="font-semibold">{requestJob.agentName ?? 'Ish beruvchi'}</span>
              {requestJob.budget && <span className="font-semibold text-slate-700">${requestJob.budget}</span>}
              {requestJob.location && <span>{requestJob.location}</span>}
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <label className="block text-xs font-bold text-slate-700 mb-2">Xabar matni (tahrirlash mumkin)</label>
              <textarea
                rows={7}
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
                placeholder="Xabaringizni yozing..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-slate-50"
              />
              <p className="text-xs text-slate-400 mt-1">{requestText.length} / 1000 belgi</p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex gap-3">
              <button
                onClick={() => setRequestJob(null)}
                disabled={sending}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleSendRequest}
                disabled={sending || !requestText.trim()}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Yuborilmoqda...</>
                ) : (
                  <><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg> So'rov yuborish</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ Aloqa Modal ════ */}
      {contactJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-indigo-500 text-white flex items-center justify-center text-base font-bold">
                  {contactJob.agentName?.charAt(0) ?? 'A'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{contactJob.agentName ?? 'Ish beruvchi'}</p>
                  <p className="text-xs text-slate-400">Ish beruvchi</p>
                </div>
              </div>
              <button
                onClick={() => setContactJob(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <hr className="border-slate-100" />

            <div className="px-5 py-4 space-y-3">
              {/* Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Himoyalangan telefon raqamlari faqat qo'ng'iroqlar uchun. Xabarlar va SMS qabul qilinmaydi.
                </p>
              </div>

              {/* Phone */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold mb-0.5">Asosiy telefon</p>
                  <p className="text-base font-bold text-slate-900">{contactJob.agentPhone ?? '+998 90 000-00-00'}</p>
                </div>
                <a
                  href={`tel:${contactJob.agentPhone ?? ''}`}
                  className="w-11 h-11 rounded-full bg-indigo-50 hover:bg-indigo-600 flex items-center justify-center transition-all group"
                >
                  <svg className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </a>
              </div>

              {/* Chat button */}
              <button
                onClick={() => {
                  setContactJob(null);
                  window.dispatchEvent(new CustomEvent('openChat', {
                    detail: {
                      userId: contactJob.agentId,
                      userName: contactJob.agentName ?? 'Ish beruvchi',
                      avatar: contactJob.agentAvatar,
                    },
                  }));
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Chatga yozing
              </button>
            </div>

            <div className="px-5 pb-4 text-center">
              <p className="text-xs text-slate-400">
                Ishni ko'rish:{' '}
                <Link href={`/jobs/${contactJob._id}`} className="text-indigo-600 font-semibold hover:underline" onClick={() => setContactJob(null)}>
                  {contactJob.title}
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════ Snackbar ════ */}
      {snackMsg && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
          snackMsg.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {snackMsg.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {snackMsg.msg}
          <button onClick={() => setSnackMsg(null)} className="ml-2 opacity-70 hover:opacity-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default withLayoutBasic(JobsPage);
