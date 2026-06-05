import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useQuery, useReactiveVar } from '@apollo/client';
import {
  MagnifyingGlass,
  ArrowRight,
  Star,
  Fire,
  Clock,
  Briefcase,
  TrendUp,
  CurrencyDollar,
  Globe,
  CheckCircle,
  Lightning,
  Lock,
  User as UserIcon,
  ClipboardText,
  ShieldCheck,
  GraduationCap,
  BookmarkSimple,
  DeviceMobile,
  AndroidLogo,
  AppleLogo,
  CaretDown,
  ChatCircle,
  Buildings,
} from '@phosphor-icons/react';
import { GET_JOBS, GET_FREELANCERS } from '../apollo/user/query';
import { compareBoostFirst } from '../libs/utils/boost';
import { userVar } from '../apollo/store';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { Job, User } from '../libs/types';
import { JobStatus, UserType } from '../libs/enums';
import { getCatIcon } from '../libs/utils/jobCategoryIcons';

// ─── Category meta ─────────────────────────────────────────────────────────────
const CAT: Record<string, { label: string; bg: string; text: string; darkBg: string; darkText: string }> = {
  VISUALS:     { label: 'Foto & Dron',           bg: '#fef3c7', text: '#92400e', darkBg: 'rgba(245,158,11,0.18)',  darkText: '#fbbf24' },
  STAGING:     { label: 'Virtual Staging',       bg: '#ede9fe', text: '#5b21b6', darkBg: 'rgba(139,92,246,0.18)', darkText: '#c4b5fd' },
  MARKETING:   { label: 'SMM & Kontent',         bg: '#dcfce7', text: '#166534', darkBg: 'rgba(34,197,94,0.15)',  darkText: '#86efac' },
  LEGAL:       { label: 'Yuridik & Kadastr',     bg: '#fee2e2', text: '#991b1b', darkBg: 'rgba(239,68,68,0.15)',  darkText: '#fca5a5' },
  RENDERING:   { label: '3D Vizualizatsiya',     bg: '#e0f2fe', text: '#075985', darkBg: 'rgba(14,165,233,0.18)', darkText: '#7dd3fc' },
  DESIGN:      { label: 'Interyer Dizayn',       bg: '#fce7f3', text: '#9d174d', darkBg: 'rgba(236,72,153,0.15)', darkText: '#f9a8d4' },
  REPAIR:      { label: "Ta'mirlash & Remont",   bg: '#fff7ed', text: '#9a3412', darkBg: 'rgba(234,88,12,0.15)',  darkText: '#fdba74' },
  CLEANING:    { label: 'Tozalash',              bg: '#ecfdf5', text: '#065f46', darkBg: 'rgba(16,185,129,0.15)', darkText: '#6ee7b7' },
  INSPECTION:  { label: "Ko'rikdan o'tkazish",   bg: '#f0f9ff', text: '#0c4a6e', darkBg: 'rgba(56,189,248,0.15)', darkText: '#7dd3fc' },
  IT:          { label: 'IT & Dasturlash',       bg: '#f5f3ff', text: '#4c1d95', darkBg: 'rgba(99,102,241,0.18)', darkText: '#a5b4fc' },
  TRANSLATION: { label: 'Tarjima',               bg: '#fff1f2', text: '#881337', darkBg: 'rgba(244,63,94,0.15)',  darkText: '#fda4af' },
  MOVING:      { label: "Ko'chish & Yuk",        bg: '#fefce8', text: '#713f12', darkBg: 'rgba(202,138,4,0.15)',  darkText: '#fde047' },
  ACCOUNTING:  { label: 'Buxgalteriya',          bg: '#f0fdf4', text: '#14532d', darkBg: 'rgba(22,163,74,0.15)',  darkText: '#86efac' },
  SECURITY:    { label: "Qo'riqlash",            bg: '#eff6ff', text: '#1e3a8a', darkBg: 'rgba(59,130,246,0.15)', darkText: '#93c5fd' },
  OTHER:       { label: 'Boshqa xizmatlar',      bg: '#f1f5f9', text: '#475569', darkBg: 'rgba(100,116,139,0.18)',darkText: '#94a3b8' },
};

const CATEGORIES_DISPLAY = [
  { key: 'IT',          icon: 'code' },
  { key: 'DESIGN',      icon: 'palette' },
  { key: 'VISUALS',     icon: 'photo_camera' },
  { key: 'RENDERING',   icon: '3d_rotation' },
  { key: 'LEGAL',       icon: 'gavel' },
  { key: 'TRANSLATION', icon: 'language' },
  { key: 'MARKETING',   icon: 'trending_up' },
  { key: 'STAGING',     icon: 'edit_note' },
  { key: 'REPAIR',      icon: 'construction' },
  { key: 'CLEANING',    icon: 'cleaning_services' },
  { key: 'INSPECTION',  icon: 'search' },
  { key: 'MOVING',      icon: 'local_shipping' },
  { key: 'ACCOUNTING',  icon: 'account_balance_wallet' },
  { key: 'SECURITY',    icon: 'security' },
  { key: 'OTHER',       icon: 'rocket_launch' },
];

const PRICING_PLANS = [
  {
    name: 'BASIC',
    price: '$3',
    period: '/oy',
    popular: false,
    features: ["10 ta ariza/oy", "Standard profil", "Chat xizmati"],
    cta: 'Tanlash',
    variant: 'outline' as const,
  },
  {
    name: 'PRO',
    price: '$7',
    period: '/oy',
    popular: true,
    features: ["Cheksiz arizalar", "Profilni yuqoriga ko'tarish", "Portfolio badge", "24/7 Priority support"],
    cta: 'Faollashtirish',
    variant: 'filled' as const,
  },
  {
    name: 'VIP',
    price: '$15',
    period: '/oy',
    popular: false,
    features: ["Barcha Pro imkoniyatlar", "Reklama krediti ($5)", "Shaxsiy menejer"],
    cta: 'Tanlash',
    variant: 'outline' as const,
  },
];

const FAQS = [
  ["Xizmat bepulmi?", "Ha, ro'yxatdan o'tish va birinchi e'lonlarni joylashtirish bepul."],
  ["To'lov xavfsizligi qanday ta'minlanadi?", "Platforma Escrow tizimi asosida ishlaydi: mablag'lar faqat ish bitgach yuboriladi."],
  ["O'zbekistondan turib xalqaro buyurtma olsa bo'ladimi?", "Kelajakda platformamizni xalqaro darajaga olib chiqish rejalashtirilgan."],
  ["Frilanserlarni qanday saralaysiz?", "Bizda tajriba va portfolio tekshiruvi orqali verifikatsiya tizimi mavjud."],
  ["Karta orqali to'lasa bo'ladimi?", "Ha, Uzcard, Humo va xalqaro kartalar qo'llab-quvvatlanadi."],
  ["Qanday qilib PRO akkauntga o'tsam bo'ladi?", "Shaxsiy kabinet orqali 'Premium' tugmasini bosishingiz kifoya."],
  ["Mijozlar bilan qanday bog'laniladi?", "Platformaning ichki xavfsiz chat tizimi mavjud."],
  ["Agar frilanser ishni bajarmasa nima bo'ladi?", "Arbitraj xizmati vaziyatni o'rganib chiqadi va pulingizni qaytarib berishi mumkin."],
];

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
  return `${Math.floor(h / 24)} kun oldin`;
}

// ─── Job Card ─────────────────────────────────────────────────────────────────
const JobCard = ({ job, hot, isDark }: { job: Job; hot?: boolean; isDark?: boolean }) => {
  const cat = CAT[job.category] ?? CAT.OTHER;
  return (
    <Link href={`/jobs/${job._id}`} className="no-underline block group">
      <div
        className="rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer border"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#e2e8f0',
          boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : undefined,
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className={`font-semibold text-sm group-hover:text-indigo-600 transition-colors leading-snug flex-1 pr-2 line-clamp-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {job.title}
          </h3>
          <BookmarkSimple size={20} className="text-slate-400 shrink-0" />
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          <span
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: isDark ? cat.darkBg : cat.bg, color: isDark ? cat.darkText : cat.text }}
          >
            {cat.label}
          </span>
          {hot && job.bidCount > 0 && (
            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'}`}>
              <Fire size={12} weight="fill" />
              {job.bidCount} ta taklif
            </span>
          )}
          {!hot && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={12} />
              {timeAgo(job.createdAt)}
            </span>
          )}
        </div>
        <div className={`flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <span className="font-bold text-indigo-600">${job.budget}</span>
          <button className={`text-sm font-semibold hover:text-indigo-600 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Ariza yuborish
          </button>
        </div>
      </div>
    </Link>
  );
};

// ─── Freelancer Card ──────────────────────────────────────────────────────────
const FreelancerCard = ({ freelancer, isDark }: { freelancer: User; isDark?: boolean }) => {
  const cat = CAT[freelancer.freelancerCategory ?? ''] ?? CAT.OTHER;
  const displayName = freelancer.fullName ?? freelancer.username ?? '';
  return (
    <Link href={`/profile/${freelancer._id}`} className="no-underline block">
      <div
        className="rounded-2xl p-6 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer border"
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          borderColor: isDark ? '#334155' : '#f1f5f9',
          boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div className="relative w-20 h-20 mx-auto mb-4">
          {freelancer.profileImage ? (
            <img
              src={freelancer.profileImage}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border-3 border-white shadow-md"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {displayName[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 border-[3px] rounded-full"
            style={{
              backgroundColor: freelancer.availability === 'AVAILABLE' ? '#22c55e' : '#f59e0b',
              borderColor: isDark ? '#1e293b' : '#ffffff',
            }}
          />
        </div>
        <div className="text-center mb-4">
          <h4 className={`font-bold text-sm truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{displayName}</h4>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: isDark ? cat.darkBg : cat.bg, color: isDark ? cat.darkText : cat.text }}
          >
            {cat.label}
          </span>
        </div>
        <div className={`grid grid-cols-3 gap-2 py-4 border-y mb-4 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <div className="text-center">
            <p className="text-xs font-bold text-indigo-600">{freelancer.averageRating?.toFixed(1) ?? '5.0'}</p>
            <p className="text-[10px] text-slate-400">Reyting</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-indigo-600">{freelancer.completedJobCount ?? 0}</p>
            <p className="text-[10px] text-slate-400">Ishlar</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-indigo-600">
              {freelancer.hourlyRate ? `$${freelancer.hourlyRate}` : '—'}
            </p>
            <p className="text-[10px] text-slate-400">Soat</p>
          </div>
        </div>
        <button className={`w-full py-2 text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all ${isDark ? 'bg-slate-700/60' : 'bg-slate-100'}`}>
          Profilni ko'rish
        </button>
      </div>
    </Link>
  );
};

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
const FaqItem = ({ question, answer, isDark }: { question: string; answer: string; isDark?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className={`w-full flex items-center justify-between p-5 text-left font-semibold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}
      >
        <span>{question}</span>
        <CaretDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className={`px-5 pb-5 text-sm border-t pt-4 leading-relaxed ${isDark ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-100'}`}>
          {answer}
        </div>
      )}
    </div>
  );
};

// ─── Home Page ────────────────────────────────────────────────────────────────
const HomePage = () => {
  const user = useReactiveVar(userVar);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const revealRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Smooth scroll-reveal: bo'limlar ekranga kirganda yumshoq paydo bo'ladi
  useEffect(() => {
    const root = revealRef.current;
    if (!root) return;
    const sections = Array.from(
      root.querySelectorAll<HTMLElement>('section:not(.bufu-hero)')
    );
    if (typeof IntersectionObserver === 'undefined') return;
    sections.forEach((el) => el.classList.add('reveal-on-scroll'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  const isDark = mounted && resolvedTheme === 'dark';
  const isLoggedIn = mounted && !!user._id;
  const isFreelancer = isLoggedIn && user.userType === UserType.FREELANCER;
  const isAgent = isLoggedIn && user.userType === UserType.AGENT;

  const { data: jobsData, loading: jobsLoading } = useQuery(GET_JOBS, {
    variables: { input: { page: 1, limit: 50 } },
    fetchPolicy: 'cache-and-network',
  });

  const { data: freelancersData, loading: freelancersLoading } = useQuery(GET_FREELANCERS, {
    variables: { input: { page: 1, limit: 50 } },
    fetchPolicy: 'cache-and-network',
  });

  const allJobs: Job[] = (jobsData?.getJobs ?? []).filter(
    (j) => j.status === JobStatus.OPEN || j.status === JobStatus.ACTIVE,
  );
  const latestJobs = [...allJobs]
    .sort((a, b) =>
      compareBoostFirst(a, b, (x, y) => {
        const cx = x.createdAt ? new Date(x.createdAt).getTime() : 0;
        const cy = y.createdAt ? new Date(y.createdAt).getTime() : 0;
        return cy - cx;
      }),
    )
    .slice(0, 6);
  const popularJobs = [...allJobs]
    .sort((a, b) =>
      compareBoostFirst(a, b, (x, y) => (y.bidCount ?? 0) - (x.bidCount ?? 0)),
    )
    .slice(0, 6);
  const allFreelancers: User[] = freelancersData?.getFreelancers ?? [];
  const topFreelancers: User[] = [...allFreelancers]
    .sort((a, b) =>
      compareBoostFirst(a, b, (x, y) => (y.averageRating ?? 0) - (x.averageRating ?? 0)),
    )
    .slice(0, 5);

  // Hero "trust" bloki uchun: rasmi borlarni oldinga qo'yib, 5 ta avatar
  const heroAvatars: User[] = [...allFreelancers]
    .sort((a, b) => (b.profileImage ? 1 : 0) - (a.profileImage ? 1 : 0))
    .slice(0, 5);
  const freelancerCount = allFreelancers.length;
  const ratedFreelancers = allFreelancers.filter((f) => (f.averageRating ?? 0) > 0);
  const heroAvgRating = ratedFreelancers.length
    ? (ratedFreelancers.reduce((sum, f) => sum + (f.averageRating ?? 0), 0) / ratedFreelancers.length).toFixed(1)
    : null;

  return (
    <div ref={revealRef} className={`home-sections${isDark ? ' is-dark' : ''}`}>
      <Head>
        <title>BuFu — O'zbekiston frilanserlar platformasi | Ish toping yoki frilanser yollang</title>
        <meta
          name="description"
          content="BuFu — O'zbekistondagi eng yaxshi frilanserlar platformasi. IT, dizayn, foto, 3D render, yuridik va boshqa sohalarda mutaxassis toping yoki ish e'lon qiling."
        />
        <meta
          name="keywords"
          content="frilanser, ish, bufu, freelance, O'zbekiston, IT freelancer, dizayn, foto, 3D render, yuridik, ish topish, mutaxassis, Toshkent"
        />
        <meta name="og:title" content="BuFu — O'zbekiston frilanserlar platformasi" />
        <meta
          name="og:description"
          content="O'zbekistondagi eng yaxshi frilanserlar platformasi. Mutaxassis toping yoki ish e'lon qiling."
        />
        <link rel="canonical" href="https://bufu.uz" />
      </Head>

      {/* ─── HERO (kod bilan · light/dark) ────────────────────────────────── */}
      <section
        className="bufu-hero relative w-screen overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0B0B14' : '#F2F1FB',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          marginTop: '-32px',
          transition: 'background-color 0.25s ease',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-24 -right-16 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(99,102,241,0.30), transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.16), transparent 70%)', filter: 'blur(20px)' }}
        />
        <div
          className="absolute top-20 -left-24 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{ background: isDark ? 'radial-gradient(circle, rgba(168,85,247,0.26), transparent 70%)' : 'radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)', filter: 'blur(20px)' }}
        />
        {/* Confetti */}
        <div className="confetti-wrap pointer-events-none absolute inset-0 overflow-hidden">
          {[
            { l: '8%',  t: '14%', c: '#6366F1', d: '0s' },
            { l: '20%', t: '8%',  c: '#A855F7', d: '.4s' },
            { l: '33%', t: '20%', c: '#F59E0B', d: '.8s' },
            { l: '46%', t: '10%', c: '#22C55E', d: '.2s' },
            { l: '60%', t: '16%', c: '#EF4444', d: '.6s' },
            { l: '74%', t: '9%',  c: '#6366F1', d: '1s' },
            { l: '88%', t: '22%', c: '#A855F7', d: '.3s' },
          ].map((p, i) => (
            <span key={i} className="confetti" style={{ left: p.l, top: p.t, backgroundColor: p.c, animationDelay: p.d }} />
          ))}
        </div>

        <div className="relative hw py-14 lg:py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* ── Left ── */}
          <div className="hero-left">
            <h1 className={`text-4xl sm:text-5xl lg:text-[3.4rem] font-black leading-[1.05] tracking-tight mb-5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Orzuingizdagi ishni{' '}
              <span style={{ background: 'linear-gradient(120deg, #6366F1, #A855F7)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                BuFu
              </span>
              da toping
            </h1>

            <p className={`text-lg leading-relaxed mb-8 max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              O'zbekistonning eng ishonchli freelancer platformasi. Mutaxassis yollang yoki o'z mahoratingiz bilan daromad olishni bugundan boshlang.
            </p>

            {/* CTA buttons — auth holati va rolga qarab */}
            <div className="flex flex-wrap items-center gap-3 mb-9">
              {isFreelancer ? (
                /* Frilanser: ish topish */
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all no-underline shadow-lg shadow-indigo-500/30"
                >
                  <MagnifyingGlass size={18} weight="bold" /> Ish topish
                </Link>
              ) : isAgent ? (
                /* Ish beruvchi (agent): ish e'lon joylash + ishchi izlash */
                <>
                  <Link
                    href="/my-works/create"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all no-underline shadow-lg shadow-indigo-500/30"
                  >
                    <Briefcase size={18} weight="bold" /> Ish e'lon joylash
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm transition-all no-underline"
                    style={{ backgroundColor: '#A855F7', boxShadow: '0 10px 24px rgba(168,85,247,0.32)' }}
                  >
                    <MagnifyingGlass size={18} weight="bold" /> Ishchi izlash
                  </Link>
                </>
              ) : (
                /* Signup bo'lmagan (mehmon) foydalanuvchi */
                <>
                  <Link
                    href="/browse"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all no-underline shadow-lg shadow-indigo-500/30"
                  >
                    <MagnifyingGlass size={18} weight="bold" /> Mutaxassis topish
                  </Link>
                  <Link
                    href="/account"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm transition-all no-underline"
                    style={{ backgroundColor: '#A855F7', boxShadow: '0 10px 24px rgba(168,85,247,0.32)' }}
                  >
                    <Briefcase size={18} weight="bold" /> Ishchi izlayapman
                  </Link>
                </>
              )}
            </div>

            {/* Trust — real frilanserlar (avatar stack) */}
            {heroAvatars.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {heroAvatars.map((f, i) => {
                    const name = f.fullName ?? f.username ?? 'U';
                    return (
                      <div
                        key={f._id}
                        className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          zIndex: heroAvatars.length - i,
                          background: 'linear-gradient(135deg,#6366F1,#A855F7)',
                          border: `2px solid ${isDark ? '#0B0B14' : '#F2F1FB'}`,
                        }}
                        title={name}
                      >
                        {f.profileImage ? (
                          <img src={f.profileImage} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          name[0]?.toUpperCase()
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    <span className="font-black" style={{ color: '#6366F1' }}>{freelancerCount}+</span> frilanser bizga ishonadi
                  </div>
                  {heroAvgRating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        {[0, 1, 2, 3, 4].map((n) => (
                          <Star key={n} size={13} weight="fill" color="#F59E0B" />
                        ))}
                      </span>
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{heroAvgRating}</span>
                      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>o'rtacha reyting</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: live cards ── */}
          <div className="hero-right relative">
            {/* Floating "Ish topdingiz!" toast */}
            <div
              className="hero-toast absolute -top-5 left-2 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
              style={{
                backgroundColor: isDark ? '#17172A' : '#FFFFFF',
                border: `1px solid ${isDark ? '#27272A' : '#ECECF5'}`,
                boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.5)' : '0 12px 30px rgba(99,102,241,0.15)',
              }}
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(120deg,#6366F1,#A855F7)' }}>
                <CheckCircle size={16} weight="fill" color="#fff" />
              </span>
              <div>
                <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Ish topdingiz! 🎉</div>
                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Yangi imkoniyat sizni kutmoqda</div>
              </div>
            </div>

            {/* Card 1: freelancer match */}
            <div
              className="hero-card relative z-10 rounded-2xl p-5 mb-4"
              style={{
                backgroundColor: isDark ? '#17172A' : '#FFFFFF',
                border: `1px solid ${isDark ? '#27272A' : '#ECECF5'}`,
                boxShadow: isDark ? '0 20px 48px rgba(0,0,0,0.5)' : '0 20px 48px rgba(99,102,241,0.12)',
              }}
            >
              <div className={`flex items-center gap-2 text-xs font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                <Star size={14} weight="fill" className="text-indigo-500" /> Sizga mos freelancer
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg" style={{ background: 'linear-gradient(135deg,#6366F1,#A855F7)' }}>
                    BR
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500" style={{ border: `2.5px solid ${isDark ? '#17172A' : '#fff'}` }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Behzod R.</div>
                  <div className="text-indigo-500 text-xs font-semibold">UI/UX Designer</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={12} weight="fill" className="text-amber-400" />
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>5.0</span>
                    <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>(128 ta baho)</span>
                  </div>
                </div>
                <div className="text-center px-3 py-2 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(34,197,94,0.14)' : '#DCFCE7' }}>
                  <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                    <CheckCircle size={14} weight="fill" /> Mos keldi!
                  </div>
                  <div className="text-[10px] text-green-600 font-semibold mt-0.5">98% moslik</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-4">
                {['Figma', 'UI/UX', 'Web Design', 'Prototyping'].map((t) => (
                  <span key={t} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
                ))}
              </div>
            </div>

            {/* Card 2: matched job */}
            <div
              className="hero-card-2 relative z-10 rounded-2xl p-5"
              style={{
                backgroundColor: isDark ? '#17172A' : '#FFFFFF',
                border: `1px solid ${isDark ? '#27272A' : '#ECECF5'}`,
                boxShadow: isDark ? '0 20px 48px rgba(0,0,0,0.5)' : '0 20px 48px rgba(99,102,241,0.12)',
              }}
            >
              <div className={`flex items-center gap-2 text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                <Briefcase size={14} weight="fill" className="text-indigo-500" /> Siz uchun mos ish
              </div>
              <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Mobil ilova uchun UI/UX dizayn</div>
              <div className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TechNova LLC · Toshkent, O'zbekiston</div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['UI/UX', 'Mobile', 'Figma'].map((t) => (
                  <span key={t} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{t}</span>
                ))}
              </div>
              <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <div className="text-indigo-500 font-black text-lg leading-none">12 000 000 so'm</div>
                  <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>bir loyiha uchun</div>
                </div>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white font-bold text-xs no-underline transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(120deg,#6366F1,#A855F7)' }}
                >
                  Taklif yuborish <ArrowRight size={14} weight="bold" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .bufu-hero { min-height: calc(100vh - 64px); display: flex; align-items: center; }
          .hero-left > * { animation: heroUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
          .hero-left > *:nth-child(1) { animation-delay: 0.05s; }
          .hero-left > *:nth-child(2) { animation-delay: 0.13s; }
          .hero-left > *:nth-child(3) { animation-delay: 0.21s; }
          .hero-left > *:nth-child(4) { animation-delay: 0.29s; }
          .hero-left > *:nth-child(5) { animation-delay: 0.37s; }
          .hero-left > *:nth-child(6) { animation-delay: 0.45s; }
          .hero-toast { animation: heroUp 0.6s ease both, floatY 4s ease-in-out 0.8s infinite; animation-delay: 0.5s; }
          .hero-card { animation: heroUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: 0.35s; }
          .hero-card-2 { animation: heroUp 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: 0.5s; }
          .confetti { position: absolute; width: 9px; height: 9px; border-radius: 2px; opacity: 0.85; animation: confettiFall 5s linear infinite; }
          @keyframes heroUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
          @keyframes confettiFall { 0% { transform: translateY(-10px) rotate(0deg); opacity: 0; } 15% { opacity: 0.9; } 100% { transform: translateY(120px) rotate(220deg); opacity: 0; } }
          @media (prefers-reduced-motion: reduce) {
            .hero-left > *, .hero-toast, .hero-card, .hero-card-2, .confetti { animation: none !important; }
          }
        `}</style>
      </section>

      {/* ─── HOW IT WORKS (step-by-step · faqat mehmonlar uchun) ──────────── */}
      {!isLoggedIn && (
        <section className="py-24 hw-bg">
          <div className="text-center mb-16">
            <span
              className="inline-block px-3 py-1 mb-3 rounded-full text-xs font-bold tracking-wide"
              style={{ background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: '#6366f1' }}
            >
              ODDIY 4 QADAM
            </span>
            <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Platforma qanday ishlaydi?</h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              Ro'yxatdan o'tib, bir necha daqiqada birinchi loyihangizni boshlang
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4">
            {/* Bog'lovchi chiziq (faqat desktop) */}
            <div
              className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                  : 'linear-gradient(90deg, #c7d2fe, #e9d5ff)',
              }}
            />
            {[
              {
                num: '1',
                title: "Ro'yxatdan o'ting",
                desc: "Frilanser yoki mijoz sifatida o'z profilingizni yarating.",
                icon: <GraduationCap size={26} weight="fill" />,
              },
              {
                num: '2',
                title: 'Loyihani joylashtiring',
                desc: 'Vazifa tavsifini yozing va budjetingizni belgilang.',
                icon: <ClipboardText size={26} weight="fill" />,
              },
              {
                num: '3',
                title: 'Eng yaxshisini tanlang',
                desc: "Nomzodlar portfoliosi va reytingini ko'rib chiqing.",
                icon: <Star size={26} weight="fill" />,
              },
              {
                num: '4',
                title: "Xavfsiz to'lov",
                desc: "Ish yakunlangandan so'ng tizim orqali to'lovni amalga oshiring.",
                icon: <ShieldCheck size={26} weight="fill" />,
              },
            ].map((step, i, arr) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative z-10 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                    boxShadow: '0 12px 28px rgba(99,102,241,0.35)',
                  }}
                >
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-indigo-600 text-xs font-black flex items-center justify-center"
                    style={{ border: '2px solid #e0e7ff' }}
                  >
                    {step.num}
                  </span>
                  {step.icon}
                </div>
                <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                <p className={`text-sm leading-relaxed max-w-[230px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {step.desc}
                </p>
                {/* Mobil uchun pastga ko'rsatkich */}
                {i < arr.length - 1 && (
                  <ArrowRight size={22} weight="bold" className="md:hidden text-indigo-400 mt-6 rotate-90" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link
              href="/account"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all no-underline shadow-lg shadow-indigo-500/30"
            >
              Hoziroq boshlash <ArrowRight size={18} weight="bold" />
            </Link>
          </div>
        </section>
      )}

      {/* ─── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div className="text-center mb-16">
          <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Yo'nalishlar bo'yicha izlash</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Har qanday murakkablikdagi vazifalar uchun mutaxassislar</p>
        </div>
        <div className="cat-marquee" style={{ width: '100%' }}>
          <div className="cat-track">
            {[...CATEGORIES_DISPLAY, ...CATEGORIES_DISPLAY].map(({ key }, i) => {
              const cat = CAT[key] ?? CAT.OTHER;
              return (
                <Link key={`${key}-${i}`} href={`/browse?category=${key}`} className="no-underline group shrink-0 w-40" aria-hidden={i >= CATEGORIES_DISPLAY.length}>
                  <div
                    className="p-5 rounded-2xl flex flex-col items-center text-center hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer border"
                    style={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.4)' : undefined,
                    }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                      style={{
                        backgroundColor: isDark ? cat.darkBg : cat.bg,
                        color: isDark ? cat.darkText : cat.text,
                      }}
                    >
                      {getCatIcon(key, 28)}
                    </div>
                    <span className={`text-xs font-semibold leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cat.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── LATEST JOBS ──────────────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Oxirgi loyihalar</h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Siz uchun mos keladigan yangi buyurtmalar</p>
          </div>
          <Link href="/jobs" className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline no-underline">
            Hammasini ko'rish <ArrowRight size={16} />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : latestJobs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
            <ClipboardText size={48} className="text-slate-300 mx-auto mb-3" />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hozircha ish e'lonlari yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestJobs.map((job) => (
              <JobCard key={job._id} job={job} isDark={isDark} />
            ))}
          </div>
        )}
      </section>

      {/* ─── POPULAR JOBS ─────────────────────────────────────────────────── */}
      <section className="py-16 hw-bg">
        <div className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Fire size={22} weight="fill" className="text-red-500" />
              <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Eng mashhur ishlar</h2>
            </div>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Eng ko'p taklif olgan va talabgir bo'lgan ish e'lonlari</p>
          </div>
          <Link href="/jobs" className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline no-underline">
            Barcha ishlar <ArrowRight size={16} />
          </Link>
        </div>

        {jobsLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : popularJobs.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
            <Fire size={48} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Hozircha ma'lumot yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularJobs.map((job) => (
              <JobCard key={job._id} job={job} hot isDark={isDark} />
            ))}
          </div>
        )}
      </section>

      {/* ─── TOP FREELANCERS ──────────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div>
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={24} weight="fill" className="text-amber-400" />
              <h2 className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Top Frilanserlar</h2>
            </div>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ishonchli va tajribali mutaxassislar bilan ishlang</p>
          </div>

          {freelancersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            </div>
          ) : topFreelancers.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border" style={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0' }}>
              <UserIcon size={48} className="text-slate-300 mx-auto mb-3" />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Hozircha frilanserlar yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {topFreelancers.map((f) => (
                <FreelancerCard key={f._id} freelancer={f} isDark={isDark} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all no-underline shadow-lg shadow-indigo-200"
            >
              Barcha frilanserlarni ko'rish <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div className="text-center mb-16">
          <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Platforma paketlari</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Ehtiyojlaringizga mos tarifni tanlang</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl flex flex-col transition-all relative overflow-hidden border ${
                plan.popular ? 'shadow-xl md:-translate-y-4' : 'hover:shadow-xl'
              }`}
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: plan.popular ? '#6366f1' : (isDark ? '#334155' : '#e2e8f0'),
                borderTopWidth: plan.popular ? '4px' : '1px',
                boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.5)' : undefined,
              }}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full tracking-wider">
                  POPULAR
                </div>
              )}
              <h3 className={`text-lg font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <CheckCircle size={16} weight="fill" className="text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {plan.variant === 'filled' ? (
                <button className="w-full py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-lg">
                  {plan.cta}
                </button>
              ) : (
                <button className={`w-full py-3 border border-indigo-600 font-semibold text-sm rounded-xl transition-all ${isDark ? 'text-indigo-400 hover:bg-indigo-900/30' : 'text-indigo-600 hover:bg-indigo-50'}`}>
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-3xl font-black text-center mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ko'p so'raladigan savollar</h2>
          <div className="space-y-3">
            {FAQS.map(([question, answer]) => (
              <FaqItem key={question} question={question} answer={answer} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP DOWNLOAD BANNER ──────────────────────────────────────────── */}
      <section className="py-24 hw-bg">
        <div className="bg-indigo-600 rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="flex-1 relative z-10">
            <h2 className="text-3xl font-black text-white mb-5">Frilans doimo qo'lingizda</h2>
            <p className="text-indigo-200 text-base mb-10 leading-relaxed">
              BuFu mobil ilovasini yuklab oling va bildirishnomalarni birinchilardan bo'lib qabul qiling.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-black text-white px-7 py-3.5 rounded-xl flex items-center gap-3 hover:scale-105 transition-transform">
                <AndroidLogo size={28} weight="fill" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Get it on</p>
                  <p className="text-base font-bold leading-none">Google Play</p>
                </div>
              </button>
              <button className="bg-black text-white px-7 py-3.5 rounded-xl flex items-center gap-3 hover:scale-105 transition-transform">
                <AppleLogo size={28} weight="fill" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Download on</p>
                  <p className="text-base font-bold leading-none">App Store</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex-1 relative z-10 flex justify-center">
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <DeviceMobile size={100} className="text-white/80" weight="thin" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER (not logged in) ───────────────────────────────────── */}
      {!isLoggedIn && (
        <section className="py-8 pb-24 hw-bg">
          <div
            className="rounded-2xl p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                Bugun ro'yxatdan o'ting — bepul!
              </h2>
              <p className="text-indigo-200 text-sm max-w-md leading-relaxed">
                O'zbekistondagi professional frilanserlar bilan bog'laning. Talabalar, yangi boshlovchilar
                va tajribali frilanserlar uchun mos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
              <Link
                href="/account"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-600 font-black text-sm rounded-xl hover:bg-slate-100 transition-all no-underline shadow-xl"
              >
                Frilanser bo'lish <ArrowRight size={16} />
              </Link>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/40 text-white font-bold text-sm rounded-xl hover:border-white hover:bg-white/10 transition-all no-underline"
              >
                Ish joylashtirish
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default withLayoutBasic(HomePage);
