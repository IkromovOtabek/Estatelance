import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import MiniMap from '../../libs/components/common/MiniMap';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMutation, useQuery, useReactiveVar } from '@apollo/client';
import {
  MapPin as LocationOnIcon,
  CurrencyDollar as AttachMoneyIcon,
  Clock as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  ArrowLeft as ArrowLeftIcon,
  Users as UsersIcon,
  Star as StarIcon,
  PaperPlane as SendIcon,
  ClipboardText,
  EnvelopeSimple,
  Briefcase,
  Tag,
  Info,
  Trophy,
  Phone,
} from '@phosphor-icons/react';
import { GET_JOB_BY_ID, GET_BIDS_FOR_JOB, GET_USER_BY_ID, GET_JOBS } from '../../apollo/user/query';
import { CREATE_BID, ACCEPT_BID, COMPLETE_JOB, INCREMENT_JOB_VIEW,
  LEAVE_REVIEW, REPEAT_HIRE, DEPOSIT_ESCROW, RELEASE_ESCROW, CREATE_DISPUTE } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Bid, Job } from '../../libs/types';
import { BidStatus, JobCategory, JOB_CATEGORY_LABELS, JobStatus, UserType } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

function timeAgo(dateStr?: string | number | null): string {
  if (!dateStr) return '';
  const raw = String(dateStr);
  // Raqamli string (Unix ms yoki seconds)
  let d: Date;
  if (/^\d+$/.test(raw)) {
    const num = Number(raw);
    d = new Date(num < 1e12 ? num * 1000 : num);
  } else {
    d = new Date(raw);
  }
  if (isNaN(d.getTime())) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1)   return 'hozirgina';
  if (m < 60)  return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} soat oldin`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} kun oldin`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} oy oldin`;
  return `${Math.floor(months / 12)} yil oldin`;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  [JobStatus.OPEN]:      { label: 'Ochiq',           color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  [JobStatus.ACTIVE]:    { label: 'Jarayonda',       color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  [JobStatus.COMPLETED]: { label: 'Yakunlandi',      color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  [JobStatus.CANCELLED]: { label: 'Bekor qilindi',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const BID_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [BidStatus.PENDING]:  { label: "Ko'rib chiqilmoqda", color: '#b45309', bg: '#fef3c7' },
  [BidStatus.ACCEPTED]: { label: 'Qabul qilindi',      color: '#16a34a', bg: '#dcfce7' },
  [BidStatus.DECLINED]: { label: 'Rad etildi',         color: '#dc2626', bg: '#fef2f2' },
};

// ─── Similar Jobs Carousel ────────────────────────────────────────────────────

const FORMAT_LABEL: Record<string, string> = {
  REMOTE: 'Masofaviy', ONSITE: 'Ofisda', HYBRID: 'Gibrid',
};

function SimilarJobs({ jobs, isDark }: { jobs: Job[]; isDark: boolean }) {
  const [idx, setIdx] = React.useState(0);
  const visible = 3;
  const max = Math.max(0, jobs.length - visible);

  const prev = () => setIdx(i => Math.max(0, i - 1));
  const next = () => setIdx(i => Math.min(max, i + 1));

  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e2e8f0';
  const textPrim   = isDark ? '#f1f5f9' : '#0f172a';
  const textSec    = isDark ? '#94a3b8' : '#64748b';
  const pageBg     = isDark ? '#0f172a' : '#f8f7ff';
  const tagBg      = isDark ? '#334155' : '#f1f5f9';
  const tagClr     = isDark ? '#cbd5e1' : '#475569';

  return (
    <div className="mt-10 rounded-2xl px-6 py-8" style={{ backgroundColor: pageBg }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight" style={{ color: textPrim }}>
            O&apos;xshash ishlar
          </h2>
          <p className="text-sm mt-1" style={{ color: textSec }}>
            Sizning ko&apos;nikmalaringizga mos keladigan boshqa takliflar
          </p>
        </div>
        {jobs.length > visible && (
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <button
              onClick={prev}
              disabled={idx === 0}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all disabled:opacity-30"
              style={{ borderColor: cardBorder, backgroundColor: cardBg, color: textSec }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              disabled={idx >= max}
              className="w-10 h-10 rounded-full border flex items-center justify-center transition-all disabled:opacity-30"
              style={{ borderColor: cardBorder, backgroundColor: cardBg, color: textSec }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.slice(idx, idx + visible).map((sj, i) => {
          const ageHours = sj.createdAt
            ? (Date.now() - new Date(sj.createdAt).getTime()) / 3_600_000
            : 999;
          const isNew    = ageHours < 48;
          const isUrgent = (sj.bidCount ?? 0) >= 5;
          const formats  = Array.isArray(sj.workFormat) ? sj.workFormat : sj.workFormat ? [sj.workFormat] : [];
          const formatStr = formats.map((f: string) => FORMAT_LABEL[f] ?? f).join(' • ');
          const budgetStr = sj.salaryFrom && sj.salaryTo
            ? `$${sj.salaryFrom.toLocaleString()} - $${sj.salaryTo.toLocaleString()}`
            : sj.budget ? `$${sj.budget.toLocaleString()}` : 'Kelishiladi';

          return (
            <Link key={sj._id} href={`/jobs/${sj._id}`} className="no-underline group">
              <div
                className="rounded-2xl p-5 flex flex-col gap-3 h-full transition-all hover:shadow-lg"
                style={{
                  backgroundColor: cardBg,
                  border: `1.5px solid ${cardBorder}`,
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = cardBorder)}
              >
                {/* Top row: badge + budget */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isNew && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#ede9fe', color: '#7c3aed' }}>
                        NEW
                      </span>
                    )}
                    {isUrgent && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded"
                        style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2', color: '#dc2626' }}>
                        URGENT
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#4f46e5' }}>{budgetStr}</span>
                </div>

                {/* Title */}
                <p className="text-base font-extrabold leading-snug line-clamp-2 transition-colors group-hover:text-indigo-600"
                  style={{ color: textPrim }}>
                  {sj.title}
                </p>

                {/* Location + format */}
                {(sj.location || formatStr) && (
                  <p className="flex items-center gap-1 text-xs" style={{ color: textSec }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[sj.location?.split(',')[0], formatStr].filter(Boolean).join(' • ')}
                  </p>
                )}

                {/* Skill tags */}
                {(sj.requiredSkills ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {(sj.requiredSkills ?? []).slice(0, 3).map((sk: string) => (
                      <span key={sk} className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ backgroundColor: tagBg, color: tagClr }}>
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const JobDetailPage = () => {
  const router = useRouter();
  const jobId = router.query.id as string;
  const user = useReactiveVar(userVar);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isFreelancer = mounted && user.userType === UserType.FREELANCER;
  const isAgent      = mounted && user.userType === UserType.AGENT;
  const isLoggedIn   = mounted && !!user._id;

  const [bidAmount, setBidAmount]         = useState('');
  const [coverLetter, setCoverLetter]     = useState('');
  const [bidError, setBidError]           = useState('');
  const [bidSuccess, setBidSuccess]       = useState(false);
  const [locationCopied, setLocationCopied] = useState(false);

  const { data: jobData, loading: jobLoading } = useQuery(GET_JOB_BY_ID, {
    variables: { jobId },
    skip: !jobId,
  });

  const { data: bidsData, loading: bidsLoading, refetch: refetchBids } = useQuery(GET_BIDS_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isAgent,
  });

  const [createBid, { loading: submitting }]    = useMutation(CREATE_BID);
  const [acceptBid, { loading: accepting }]     = useMutation(ACCEPT_BID);
  const [completeJob, { loading: completing }]  = useMutation(COMPLETE_JOB);
  const [leaveReview, { loading: reviewing }]   = useMutation(LEAVE_REVIEW);
  const [repeatHire,  { loading: rehiring }]    = useMutation(REPEAT_HIRE);
  const [depositEscrow]                         = useMutation(DEPOSIT_ESCROW);
  const [releaseEscrow, { loading: releasing }] = useMutation(RELEASE_ESCROW);
  const [createDispute, { loading: disputing }] = useMutation(CREATE_DISPUTE);
  const [incrementJobView] = useMutation(INCREMENT_JOB_VIEW);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating]       = useState(5);
  const [reviewText, setReviewText]           = useState('');
  const [reviewError, setReviewError]         = useState('');

  // Dispute modal state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason]       = useState('');

  // Escrow modal state
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [escrowAmount, setEscrowAmount]       = useState('');

  // Increment view once when page loads and user is logged in
  useEffect(() => {
    if (jobId && user._id) {
      incrementJobView({ variables: { jobId } });
    }
  }, [jobId, user._id]);

  const job: Job | null = jobData?.getJobById ?? null;
  const bids: Bid[]     = bidsData?.getBidsForJob ?? [];

  // Agent's phone number — to display on "Aloqa" button
  const { data: agentData } = useQuery(GET_USER_BY_ID, {
    variables: { userId: job?.agentId },
    skip: !job?.agentId,
  });
  const agentPhone = job?.contactPhone || agentData?.getUserById?.phoneNumber || null;

  const { data: similarJobsData } = useQuery(GET_JOBS, {
    variables: {
      input: {
        category: job?.category,
        limit: 5,
        page: 1,
      },
    },
    skip: !job?.category,
  });
  const similarJobs: Job[] = (similarJobsData?.getJobs ?? []).filter(
    (j: Job) => j._id !== jobId,
  ).slice(0, 4);

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) { setBidError("Iltimos, to'g'ri taklif summasi kiriting."); return; }
    if (!coverLetter.trim())    { setBidError('Iltimos, qopqoq xat yozing.'); return; }
    try {
      await createBid({ variables: { input: { jobId, bidAmount: amount, coverLetter: coverLetter.trim() } } });
      setBidSuccess(true);
      setBidAmount('');
      setCoverLetter('');
    } catch (err: any) {
      setBidError(err.message ?? 'Taklif yuborishda xatolik yuz berdi.');
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!window.confirm('Ushbu taklifni qabul qilasizmi? Boshqa barcha takliflar avtomatik rad etiladi.')) return;
    await acceptBid({ variables: { bidId } });
    refetchBids();
  };

  const handleCompleteJob = async () => {
    if (!job) return;
    if (!window.confirm("Ishni yakunlandi deb belgilaysizmi? Bu amalni qaytarib bo'lmaydi.")) return;
    await completeJob({ variables: { jobId: job._id } });
    router.reload();
  };

  const handleLeaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError('');
    if (!reviewText.trim()) { setReviewError('Sharh matni kiriting'); return; }
    try {
      await leaveReview({ variables: { input: { jobId: job!._id, rating: reviewRating, reviewText: reviewText.trim() } } });
      setShowReviewModal(false);
      setReviewText(''); setReviewRating(5);
      router.reload();
    } catch (err: any) { setReviewError(err.message); }
  };

  const handleRepeatHire = async () => {
    if (!window.confirm('Xuddi shu frilanser bilan yangi ish ochasizmi?')) return;
    const result = await repeatHire({ variables: { jobId: job!._id } });
    const newJobId = result?.data?.repeatHire?._id;
    if (newJobId) router.push(`/jobs/${newJobId}`);
  };

  const handleDepositEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(escrowAmount);
    if (!amount || amount <= 0) return;
    await depositEscrow({ variables: { jobId: job!._id, amount } });
    setShowEscrowModal(false);
    router.reload();
  };

  const handleReleaseEscrow = async () => {
    if (!window.confirm("Escrow to'lovini frilanserga chiqarasizmi?")) return;
    await releaseEscrow({ variables: { jobId: job!._id } });
    router.reload();
  };

  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    await createDispute({ variables: { input: { jobId: job!._id, reason: disputeReason.trim() } } });
    setShowDisputeModal(false);
    setDisputeReason('');
    router.reload();
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (jobLoading || !jobId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Yuklanmoqda...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-24">
        <ClipboardText size={56} color="#94a3b8" className="mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Ish topilmadi</h2>
        <p className="text-sm text-slate-500 mb-6">Bu ish o'chirilgan yoki mavjud emas</p>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          Barcha ishlarga qaytish
        </Link>
      </div>
    );
  }

  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG[JobStatus.OPEN];
  const isOwn  = isAgent && user._id === job.agentId;
  const handleCopyLocation = () => {
    if (!job.location) return;
    navigator.clipboard.writeText(job.location).then(() => {
      setLocationCopied(true);
      setTimeout(() => setLocationCopied(false), 2000);
    });
  };

  return (
    <>
      <Head>
        <title>{job.title} — BuFu</title>
        <meta name="description" content={job.description?.slice(0, 155)} />
        <meta property="og:title" content={`${job.title} — BuFu`} />
        <meta property="og:description" content={job.description?.slice(0, 155)} />
        <meta property="og:type" content="article" />
      </Head>

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-sm font-medium hover:bg-slate-100 px-2 py-1 rounded-lg transition-all"
        >
          <ArrowLeftIcon size={15} />
          Ishlar
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-400 truncate max-w-xs">{job.title}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">

        {/* ════ LEFT: Job details ════ */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Hero card */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] px-6 py-7 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

              {/* Category + Status */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/15 rounded-full px-3 py-1 text-indigo-300 text-xs font-semibold">
                  <span className="flex">{getCatIcon(job.category, 13)}</span>
                  {JOB_CATEGORY_LABELS[job.category as JobCategory]}
                </span>
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold border"
                  style={{ color: status.color, background: status.bg, borderColor: status.border }}
                >
                  {status.label}
                </span>
              </div>

              <h1 className="text-white font-extrabold text-xl md:text-2xl leading-tight mb-4">
                {job.title}
              </h1>

              {/* Agent row */}
              {job.agentId && (
                <Link href={`/profile/${job.agentId}`} className="inline-flex items-center gap-2 no-underline">
                  <div className="w-7 h-7 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white text-xs font-bold">
                    {job.agentName?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <span className="text-white/75 text-sm font-medium">
                    {job.agentName ?? 'Agent'} tomonidan joylashtirildi
                  </span>
                </Link>
              )}
            </div>

            {/* Stats strip */}
            <div className="mx-5 my-5 p-4 bg-white border border-slate-100 rounded-xl shadow-md flex flex-wrap gap-4">
              {/* Budget */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <AttachMoneyIcon size={18} color="#16a34a" />
                </div>
                <div>
                  {job.budget === 0 ? (
                    <p className="text-base font-black leading-none flex items-center gap-1" style={{ color: '#22c55e' }}>
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
                      Kelishiladi
                    </p>
                  ) : (
                    <p className="text-lg font-black text-slate-900 leading-none">${job.budget}</p>
                  )}
                  <p className="text-xs text-slate-400">byudjet</p>
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              {/* Bid count */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <SendIcon size={18} color="#4f46e5" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-none">{job.bidCount}</p>
                  <p className="text-xs text-slate-400">taklif</p>
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              {/* View count */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: isDark ? 'rgba(2,132,199,0.15)' : '#e0f2fe' }}
                >
                  <svg width="18" height="18" fill="none" strokeWidth={2} viewBox="0 0 24 24"
                    stroke={isDark ? '#38bdf8' : '#0284c7'}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-black leading-none" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                    {job.viewCount ?? 0}
                  </p>
                  <p className="text-xs text-slate-400">ko&apos;rish</p>
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              {/* Time */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <AccessTimeIcon size={18} color="#64748b" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">
                    {timeAgo(job.createdAt) || '—'}
                  </p>
                  <p className="text-xs text-slate-400">joylashtirilgan</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pb-6">
              <h2 className="font-bold text-sm text-slate-900 mb-3">Loyiha tavsifi</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>

              {/* Agent action buttons for ACTIVE job */}
              {isOwn && job.status === JobStatus.ACTIVE && (
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleCompleteJob}
                      disabled={completing}
                      className="inline-flex items-center gap-2 border border-green-400 text-green-700 hover:bg-green-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-60"
                    >
                      <CheckCircleIcon size={17} />
                      {completing ? 'Saqlanmoqda...' : 'Yakunlandi'}
                    </button>

                    {/* Escrow */}
                    {(job as any).escrowStatus === 'HELD' ? (
                      <button
                        onClick={handleReleaseEscrow}
                        disabled={releasing}
                        className="inline-flex items-center gap-2 border border-indigo-400 text-indigo-700 hover:bg-indigo-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-60"
                      >
                        💸 {releasing ? '...' : "To'lov chiqarish"}
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowEscrowModal(true)}
                        className="inline-flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                      >
                        🔒 Escrow to'ldirish
                      </button>
                    )}

                    {/* Dispute */}
                    <button
                      onClick={() => setShowDisputeModal(true)}
                      className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                    >
                      ⚠️ Nizo ochish
                    </button>
                  </div>
                </div>
              )}

              {/* Completed job actions: review + repeat hire */}
              {isOwn && job.status === JobStatus.COMPLETED && (
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                  {!(job as any).agentRating && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 border border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                    >
                      ⭐ Sharh qoldirish
                    </button>
                  )}
                  <button
                    onClick={handleRepeatHire}
                    disabled={rehiring}
                    className="inline-flex items-center gap-2 border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all ml-2 disabled:opacity-60"
                  >
                    🔄 {rehiring ? '...' : 'Qayta yollash'}
                  </button>
                </div>
              )}

              {/* Freelancer: leave review + dispute on ACTIVE */}
              {!isOwn && (job as any).hiredFreelancerId === user._id && job.status === JobStatus.COMPLETED && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  {!(job as any).freelancerRating && (
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="inline-flex items-center gap-2 border border-amber-300 text-amber-700 hover:bg-amber-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                    >
                      ⭐ Agent haqida sharh
                    </button>
                  )}
                </div>
              )}
              {!isOwn && (job as any).hiredFreelancerId === user._id && job.status === JobStatus.ACTIVE && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="inline-flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                  >
                    ⚠️ Nizo ochish
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location map */}
          {job.location && (
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
              <h2 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Briefcase size={15} color="#6366f1" />
                Ish manzili
              </h2>
              {/* Address + copy inline */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-1.5 flex-1 min-w-0">
                  <LocationOnIcon size={14} color="#6366f1" weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    {job.location.split(',').slice(0, 4).join(', ')}
                  </span>
                </div>
                <button
                  onClick={handleCopyLocation}
                  title="Nusxa olish"
                  className="flex-shrink-0 p-1.5 rounded-lg transition-all"
                  style={{ color: locationCopied ? '#22c55e' : '#94a3b8', backgroundColor: locationCopied ? 'rgba(34,197,94,0.1)' : 'transparent' }}
                >
                  {locationCopied ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  )}
                </button>
              </div>
              <MiniMap address={job.location} height={180} hideAddressRow />
            </div>
          )}

          {/* Skills required (chips from category label) */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
            <h2 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Tag size={15} color="#4f46e5" />
              Talab qilinadigan ko'nikmalar
            </h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                {JOB_CATEGORY_LABELS[job.category as JobCategory]}
              </span>
            </div>
          </div>

          {/* ── Bids (owner only) ── */}
          {isOwn && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                <UsersIcon size={17} color="#4f46e5" />
                <h2 className="font-bold text-sm text-slate-900">Takliflar</h2>
                <span className="bg-indigo-50 text-indigo-600 text-xs font-black px-2 py-0.5 rounded-full ml-1">
                  {job.bidCount}
                </span>
              </div>

              <div className="p-5">
                {bidsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-7 h-7 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  </div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-10">
                    <EnvelopeSimple size={40} color="#94a3b8" className="mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Hozircha taklif yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bids.map(bid => {
                      const bidStatus = BID_STATUS_CONFIG[bid.status] ?? BID_STATUS_CONFIG[BidStatus.PENDING];
                      const isAccepted = bid.status === BidStatus.ACCEPTED;
                      return (
                        <div
                          key={bid._id}
                          className={`p-4 rounded-xl border transition-all ${isAccepted ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                                {bid.freelancerName?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <Link href={`/profile/${bid.freelancerId}`} className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors no-underline">
                                  {bid.freelancerName}
                                </Link>
                                <p className="text-xs text-slate-400">{timeAgo(bid.createdAt)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-indigo-600">${bid.bidAmount}</p>
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ color: bidStatus.color, background: bidStatus.bg }}
                              >
                                {bidStatus.label}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 leading-relaxed mb-3">{bid.coverLetter}</p>

                          {job.status === JobStatus.OPEN && bid.status === BidStatus.PENDING && (
                            <button
                              onClick={() => handleAcceptBid(bid._id)}
                              disabled={accepting}
                              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                            >
                              <CheckCircleIcon size={14} />
                              Ushbu taklifni qabul qilish
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT: Sticky sidebar ════ */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-4 md:sticky md:top-20 md:self-start">

          {/* ── Bid form (freelancers, open job) ── */}
          {isFreelancer && job.status === JobStatus.OPEN && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase size={15} color="white" />
                  <h3 className="font-extrabold text-white text-base">Taklif yuborish</h3>
                </div>
                <p className="text-xs text-white/75">O'z narx va tajribangizni ko'rsating</p>
              </div>

              <div className="p-5">
                {bidSuccess ? (
                  <div className="text-center py-6">
                    <Trophy size={44} color="#f59e0b" weight="fill" className="mx-auto mb-2" />
                    <h4 className="font-bold text-slate-900 mb-1">Taklif yuborildi!</h4>
                    <p className="text-sm text-slate-500">Agent tez orada siz bilan bog'lanadi</p>
                  </div>
                ) : (
                  <form onSubmit={handleBidSubmit} className="space-y-3">
                    {bidError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-sm font-medium">
                        {bidError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Taklif summasi ($) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">
                          <AttachMoneyIcon size={16} color="#94a3b8" />
                        </span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={e => setBidAmount(e.target.value)}
                          min={1}
                          required
                          placeholder="0"
                          className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Qopqoq xat <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        required
                        rows={5}
                        placeholder="O'zingiz va tajribangiz haqida yozing. Nega aynan siz bu ishga mos kelasiz?"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-xl transition-colors"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Yuborilmoqda...
                        </>
                      ) : (
                        <>
                          <SendIcon size={15} />
                          Taklif yuborish
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ── Login prompt ── */}
          {!isLoggedIn && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
              <div className="text-4xl mb-3">🔐</div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Taklif berish uchun kiring</h3>
              <p className="text-xs text-slate-500 mb-4">Frilanser sifatida kirib taklif yuborishingiz mumkin</p>
              <Link
                href="/account"
                className="w-full block text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 rounded-xl transition-colors no-underline"
              >
                Kirish / Ro'yxatdan o'tish
              </Link>
            </div>
          )}

          {/* ── Info for other agents ── */}
          {isAgent && !isOwn && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Info size={15} color="#c2410c" />
                <p className="text-sm text-amber-800 font-semibold">Faqat frilanserlar taklif bera oladi</p>
              </div>
            </div>
          )}

          {/* ── Job summary card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Ish haqida</h3>
            </div>
            <div className="p-5 space-y-3.5">
              {/* Byudjet */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <AttachMoneyIcon size={15} color="#16a34a" />
                  Byudjet
                </div>
                {job.budget === 0 ? (
                  <span className="flex items-center gap-1 text-sm font-bold" style={{ color: '#22c55e' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
                    Kelishiladi
                  </span>
                ) : (
                  <span className="text-sm text-green-700 font-bold">
                    {job.salaryFrom && job.salaryTo
                      ? `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`
                      : `$${job.budget}`}
                  </span>
                )}
              </div>

              {/* Takliflar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <EnvelopeSimple size={15} color="#4f46e5" />
                  Takliflar
                </div>
                <span className="text-sm text-indigo-600 font-bold">{job.bidCount} ta</span>
              </div>

              {/* Holati */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <CheckCircleIcon size={15} color={status.color} />
                  Holati
                </div>
                <span className="text-sm font-bold" style={{ color: status.color }}>{status.label}</span>
              </div>

              {/* Kategoriya */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Tag size={15} color="#64748b" />
                  Kategoriya
                </div>
                <span className="text-sm text-slate-700 font-semibold">{JOB_CATEGORY_LABELS[job.category as JobCategory]}</span>
              </div>

              {/* Joylashtirilgan sana */}
              {job.createdAt && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <AccessTimeIcon size={15} color="#64748b" />
                    Joylashtirilgan
                  </div>
                  <span className="text-sm text-slate-700 font-semibold">
                    {timeAgo(job.createdAt) || '—'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Poster info card ── */}
          {job.agentId && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Ish beruvchi</h3>
              </div>
              <div className="p-5 space-y-3">
                <Link href={`/profile/${job.agentId}`} className="flex items-center gap-3 no-underline group">
                  <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
                    {job.agentName?.[0]?.toUpperCase() ?? 'A'}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {job.agentName ?? 'Agent'}
                    </p>
                    <p className="text-xs text-slate-400">Ish beruvchi</p>
                  </div>
                </Link>

                {agentPhone ? (
                  <a
                    href={`tel:${agentPhone.replace(/\s/g, '')}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
                  >
                    <Phone size={16} weight="fill" />
                    Aloqa: {agentPhone}
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed">
                    <Phone size={16} />
                    Telefon ko&apos;rsatilmagan
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recommended jobs ── */}
      {similarJobs.length > 0 && (
        <SimilarJobs jobs={similarJobs} isDark={isDark} />
      )}

      {/* ─── Review Modal ─────────────────────────────────────────────────── */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">⭐ Sharh qoldirish</h3>
            <form onSubmit={handleLeaveReview} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reyting</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setReviewRating(s)}
                      className={`text-2xl transition-transform hover:scale-110 ${s <= reviewRating ? 'opacity-100' : 'opacity-30'}`}
                    >
                      ⭐
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-amber-600 self-center">{reviewRating}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sharh matni</label>
                <textarea
                  value={reviewText}
                  onChange={e => setReviewText(e.target.value)}
                  rows={4}
                  placeholder="Hamkorlik tajribasi, sifat, muloqot haqida yozing..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              {reviewError && <p className="text-sm text-red-600">{reviewError}</p>}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                  Bekor
                </button>
                <button type="submit" disabled={reviewing}
                  className="px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl disabled:opacity-50">
                  {reviewing ? 'Saqlanmoqda...' : 'Yuborish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Escrow Modal ─────────────────────────────────────────────────── */}
      {showEscrowModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">🔒 Escrow to'ldirish</h3>
            <p className="text-sm text-slate-500 mb-4">
              Pul muzlatiladi va ish yakunlanganda frilanserga chiqariladi.
            </p>
            <form onSubmit={handleDepositEscrow} className="space-y-4">
              <input
                type="number" min={1} placeholder="Summa ($)"
                value={escrowAmount}
                onChange={e => setEscrowAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowEscrowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                  Bekor
                </button>
                <button type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                  To'ldirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Dispute Modal ────────────────────────────────────────────────── */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">⚠️ Nizo ochish</h3>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700">
                Nizo ochilsa escrow to'lovi muzlatiladi. Admin hal qilguncha kutiladi.
              </p>
            </div>
            <form onSubmit={handleCreateDispute} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nizo sababi</label>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  rows={4}
                  placeholder="Muammoni batafsil yozing..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50">
                  Bekor
                </button>
                <button type="submit" disabled={disputing}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">
                  {disputing ? 'Yuborilmoqda...' : 'Nizo ochish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default withLayoutBasic(JobDetailPage);
