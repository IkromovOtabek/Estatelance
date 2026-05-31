import React, { useEffect, useState } from 'react';
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
} from '@phosphor-icons/react';
import { GET_JOB_BY_ID, GET_BIDS_FOR_JOB } from '../../apollo/user/query';
import { CREATE_BID, ACCEPT_BID, COMPLETE_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Bid, Job } from '../../libs/types';
import { BidStatus, JobCategory, JOB_CATEGORY_LABELS, JobStatus, UserType } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
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

const JobDetailPage = () => {
  const router = useRouter();
  const jobId = router.query.id as string;
  const user = useReactiveVar(userVar);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isFreelancer = mounted && user.userType === UserType.FREELANCER;
  const isAgent      = mounted && user.userType === UserType.AGENT;
  const isLoggedIn   = mounted && !!user._id;

  const [bidAmount, setBidAmount]     = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [bidError, setBidError]       = useState('');
  const [bidSuccess, setBidSuccess]   = useState(false);

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

  const job: Job | null = jobData?.getJobById ?? null;
  const bids: Bid[]     = bidsData?.getBidsForJob ?? [];

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

  return (
    <>
      <Head><title>{job.title} — BuFu</title></Head>

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
                  <p className="text-lg font-black text-slate-900 leading-none">${job.budget}</p>
                  <p className="text-xs text-slate-400">byudjet</p>
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              {/* Bid count */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <UsersIcon size={18} color="#4f46e5" />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-none">{job.bidCount}</p>
                  <p className="text-xs text-slate-400">taklif</p>
                </div>
              </div>

              <div className="w-px bg-slate-100 self-stretch" />

              {/* Time */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <AccessTimeIcon size={18} color="#64748b" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{timeAgo(job.createdAt)}</p>
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

              {/* Complete job button */}
              {isOwn && job.status === JobStatus.ACTIVE && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <button
                    onClick={handleCompleteJob}
                    disabled={completing}
                    className="inline-flex items-center gap-2 border border-green-400 text-green-700 hover:bg-green-50 font-semibold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-60"
                  >
                    <CheckCircleIcon size={17} />
                    {completing ? 'Saqlanmoqda...' : 'Ishni yakunlandi deb belgilash'}
                  </button>
                </div>
              )}
            </div>
          </div>

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
        <div className="w-full md:w-80 flex-shrink-0 md:sticky md:top-20 space-y-4">

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
              {([
                {
                  label: 'Byudjet',
                  value: `$${job.budget}`,
                  icon: <AttachMoneyIcon size={15} color="#16a34a" />,
                  valueClass: 'text-green-700 font-bold',
                },
                {
                  label: 'Takliflar',
                  value: `${job.bidCount} ta`,
                  icon: <EnvelopeSimple size={15} color="#4f46e5" />,
                  valueClass: 'text-indigo-600 font-bold',
                },
                {
                  label: 'Holati',
                  value: status.label,
                  icon: <CheckCircleIcon size={15} color={status.color} />,
                  valueClass: 'font-bold',
                  valueStyle: { color: status.color },
                },
                {
                  label: 'Kategoriya',
                  value: JOB_CATEGORY_LABELS[job.category as JobCategory],
                  icon: <Tag size={15} color="#64748b" />,
                  valueClass: 'text-slate-700 font-semibold',
                },
              ] as Array<{ label: string; value: string; icon: React.ReactNode; valueClass: string; valueStyle?: React.CSSProperties }>).map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <span className="flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </div>
                  <span className={`text-sm ${item.valueClass}`} style={item.valueStyle}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Poster info card ── */}
          {job.agentId && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Ish beruvchi</h3>
              </div>
              <div className="p-5">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(JobDetailPage);
