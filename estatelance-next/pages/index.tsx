import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useFavorites } from '../libs/hooks/useFavorites';
import { useQuery, useReactiveVar } from '@apollo/client';
import {
  ArrowRight,
  ArrowUpRight,
  Star,
  Fire,
  Clock,
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
  MapPin,
  SealCheck,
  TrendUp as TrendUpIcon,
  MagnifyingGlass,
  Briefcase,
} from '@phosphor-icons/react';

import { GET_JOBS, GET_FREELANCERS, GET_POSTS } from '../apollo/user/query';
import { compareBoostFirst } from '../libs/utils/boost';
import { userVar } from '../apollo/store';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import JobCard from '../libs/components/common/JobCard';
import HeroLatestArticles from '../libs/components/home/HeroLatestArticles';
import { Job, User, Post } from '../libs/types';
import { JobStatus, UserType } from '../libs/enums';
import { getCatIcon } from '../libs/utils/jobCategoryIcons';

// ─── Hero to'liq-fon video ───────────────────────────────────────────────────
// Spline'dan MP4 export qilib, ffmpeg bilan siqilgach quyidagi fayllarni
// `public/hero/` ga tashlang. Bo'sh bo'lsa — eski indigo gradient fon ishlaydi.
//   public/hero/bufu-hero.webm  (asosiy, yengil)
//   public/hero/bufu-hero.mp4   (Safari/iOS fallback)
//   public/hero/bufu-hero-poster.jpg  (video yuklanguncha ko'rinadigan rasm)
const HERO_VIDEO_SRC = '';        // masalan: '/hero/bufu-hero' (kengaytmasiz) — yoqilganda video chiqadi
const HERO_VIDEO_POSTER = '/hero/bufu-hero-poster.jpg';

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
  OTHER:       { label: 'Boshqa xizmatlar',      bg: '#f1f5f9', text: '#3A3A48', darkBg: 'rgba(100,116,139,0.18)',darkText: '#94a3b8' },
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


// ─── Freelancer Card ──────────────────────────────────────────────────────────
const FreelancerCard = ({ freelancer, isDark }: { freelancer: User; isDark?: boolean }) => {
  const cat = CAT[freelancer.freelancerCategory ?? ''] ?? CAT.OTHER;
  const displayName = freelancer.fullName ?? freelancer.username ?? '';
  return (
    <Link href={`/profile/${freelancer._id}`} className="no-underline block">
      <div className="card-base job-card p-6 cursor-pointer">
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
              borderColor: 'var(--surface)',
            }}
          />
        </div>
        <div className="text-center mb-4">
          <h4 className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{displayName}</h4>
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{ backgroundColor: isDark ? cat.darkBg : cat.bg, color: isDark ? cat.darkText : cat.text }}
          >
            {cat.label}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 py-4 border-y mb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{freelancer.averageRating?.toFixed(1) ?? '5.0'}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>Reyting</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{freelancer.completedJobCount ?? 0}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>Ishlar</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {freelancer.hourlyRate ? `$${freelancer.hourlyRate}` : '—'}
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>Soat</p>
          </div>
        </div>
        <button
          className="w-full py-2 text-sm font-semibold rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
          style={{ background: 'var(--surface-3)', color: 'var(--primary)' }}
        >
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
    <div className="card-flat overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between p-5 text-left font-semibold text-sm"
        style={{ color: 'var(--text-1)' }}
      >
        <span>{question}</span>
        <CaretDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ml-3 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="px-5 pb-5 text-sm border-t pt-4 leading-relaxed"
          style={{ color: 'var(--text-3)', borderColor: 'var(--border)' }}
        >
          {answer}
        </div>
      )}
    </div>
  );
};

// ─── Skeleton grid (yuklanish holati — spinner o'rniga shimmer kartalar) ───────
const SkeletonGrid = ({ count, cols, h }: { count: number; cols: string; h: number }) => (
  <div className={`grid ${cols} gap-4 sm:gap-5 lg:gap-6 items-stretch`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: h }} />
    ))}
  </div>
);

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

  const { data: postsData, loading: postsLoading } = useQuery(GET_POSTS, {
    variables: { page: 1, limit: 20 },
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
    .slice(0, 8);   // 4 ustun × 2 qator = 8 ta
  const popularJobs = [...allJobs]
    .sort((a, b) =>
      compareBoostFirst(a, b, (x, y) => (y.bidCount ?? 0) - (x.bidCount ?? 0)),
    )
    .slice(0, 4);   // faqat 1 qator (4 ta)
  const allFreelancers: User[] = freelancersData?.getFreelancers ?? [];
  const topFreelancers: User[] = [...allFreelancers]
    .sort((a, b) =>
      compareBoostFirst(a, b, (x, y) => (y.averageRating ?? 0) - (x.averageRating ?? 0)),
    )
    .slice(0, 5);

  const latestPosts: Post[] = [...(postsData?.getPosts ?? [])].sort((a, b) => {
    const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return cb - ca;
  });

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

      {/* ─── HERO — Aurora to'liq-ekran rasm swiper (har 5s almashadi) ─────── */}
      <section
        className="bufu-hero relative w-screen overflow-hidden"
        style={{
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          marginTop: '-120px',
        }}
      >
        {HERO_VIDEO_SRC ? (
          <>
            {/* Spline export — to'liq-fon video (autoplay · muted · loop) */}
            <video
              className="hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={HERO_VIDEO_POSTER}
              aria-hidden="true"
            >
              <source src={`${HERO_VIDEO_SRC}.webm`} type="video/webm" />
              <source src={`${HERO_VIDEO_SRC}.mp4`} type="video/mp4" />
            </video>
            {/* Matn o'qilishi uchun overlay (light/dark alohida — app.scss) */}
            <div className="hero-video-overlay" />
          </>
        ) : null}

        {/* Scroll indikatori */}
        <div className="hero-scroll">
          <span>Scroll</span>
          <CaretDown size={18} weight="bold" />
        </div>

        {/* Ikki ustun: chap matn + CTA · o'ng stacked frilanser karuseli */}
        <div className="hero-content hero-content--freelancers relative z-10 hw">
          <div className="hero-left hero-rise">
            <span className="hero-eyebrow">✦ O&apos;zbekistonning №1 frilanser platformasi</span>
            <h1 className="hero-title">
              Orzuingizdagi ishni{' '}
              <span className="hero-brand">BuFu</span>da toping
            </h1>
            <p className="hero-sub">
              O&apos;zbekistonning eng ishonchli frilanser platformasi. Mutaxassis yollang yoki
              o&apos;z mahoratingiz bilan daromad olishni bugundan boshlang.
            </p>
            <div className="hero-ctas">
              {isFreelancer ? (
                <Link href="/jobs" className="hero-cta hero-cta-primary no-underline">
                  Ish topish
                  <ArrowUpRight size={18} weight="bold" />
                </Link>
              ) : isAgent ? (
                <>
                  <Link href="/my-works/create" className="hero-cta hero-cta-primary no-underline">
                    Ish e&apos;lon joylash
                    <ArrowUpRight size={18} weight="bold" />
                  </Link>
                  <Link href="/browse" className="hero-cta hero-cta-secondary no-underline">
                    Ishchi izlash
                    <ArrowUpRight size={18} weight="bold" />
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/browse" className="hero-cta hero-cta-primary no-underline">
                    Mutaxassis topish
                    <ArrowUpRight size={18} weight="bold" />
                  </Link>
                  <Link href="/account" className="hero-cta hero-cta-secondary no-underline">
                    Ish izlayapman
                    <ArrowUpRight size={18} weight="bold" />
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="hero-articles-panel hero-rise" style={{ animationDelay: '0.12s' }}>
            <HeroLatestArticles posts={latestPosts} loading={postsLoading} />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (step-by-step · faqat mehmonlar uchun) ──────────── */}
      {!isLoggedIn && (
        <section className="section-pad hw-bg">
          <div className="section-head text-center flex flex-col items-center">
            <span className="h-eyebrow mb-4">ODDIY 4 QADAM</span>
            <h2 className="h-section mb-3">Platforma qanday ishlaydi?</h2>
            <p className="t-lead">
              Ro'yxatdan o'tib, bir necha daqiqada birinchi loyihangizni boshlang
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-4">
            {/* Bog'lovchi chiziq (faqat desktop) */}
            <div
              className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5"
              style={{
                background: isDark
                  ? 'linear-gradient(90deg, #6366f1, #818CF8)'
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
              <div
                key={step.num}
                className="hw-step relative flex flex-col items-center text-center"
                style={{ transitionDelay: `${i * 0.12}s` }}
              >
                <div
                  className="hw-step-icon w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative z-10 text-white"
                  style={{
                    background: 'linear-gradient(135deg, #818CF8, #A5B4FC)',
                    boxShadow: '0 14px 32px rgba(99,102,241,0.28)',
                  }}
                >
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white text-indigo-500 text-xs font-black flex items-center justify-center"
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
      <section className="section-pad hw-bg">
        <div className="section-head text-center">
          <h2 className="h-section mb-3">Yo'nalishlar bo'yicha izlash</h2>
          <p className="t-lead">Har qanday murakkablikdagi vazifalar uchun mutaxassislar</p>
        </div>
        <div className="cat-marquee" style={{ width: '100%' }}>
          <div className="cat-track">
            {[...CATEGORIES_DISPLAY, ...CATEGORIES_DISPLAY].map(({ key }, i) => {
              const cat = CAT[key] ?? CAT.OTHER;
              return (
                <Link key={`${key}-${i}`} href={`/browse?category=${key}`} className="no-underline group shrink-0 w-40" aria-hidden={i >= CATEGORIES_DISPLAY.length}>
                  <div className="card-base p-5 flex flex-col items-center text-center cursor-pointer">
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
      <section className="section-pad hw-bg">
        <div className="section-head flex justify-between items-end gap-4">
          <div>
            <h2 className="h-section mb-2">Oxirgi loyihalar</h2>
            <p className="t-lead">Siz uchun mos keladigan yangi buyurtmalar</p>
          </div>
          <Link href="/jobs" className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline no-underline shrink-0">
            Hammasini ko'rish <ArrowRight size={16} />
          </Link>
        </div>

        {jobsLoading ? (
          <SkeletonGrid count={8} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" h={232} />
        ) : latestJobs.length === 0 ? (
          <div className="empty-state">
            <ClipboardText size={48} className="empty-icon text-slate-300" />
            <p className="empty-desc">Hozircha ish e'lonlari yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
            {latestJobs.map((job) => (
              <JobCard key={job._id} job={job} isDark={isDark} />
            ))}
          </div>
        )}
      </section>

      {/* ─── POPULAR JOBS ─────────────────────────────────────────────────── */}
      <section className="section-pad hw-bg">
        <div className="section-head flex justify-between items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Fire size={22} weight="fill" className="text-red-500" />
              <h2 className="h-section">Eng mashhur ishlar</h2>
            </div>
            <p className="t-lead">Eng ko'p taklif olgan va talabgir bo'lgan ish e'lonlari</p>
          </div>
          <Link href="/jobs" className="text-indigo-600 text-sm font-semibold flex items-center gap-1 hover:underline no-underline shrink-0">
            Barcha ishlar <ArrowRight size={16} />
          </Link>
        </div>

        {jobsLoading ? (
          <SkeletonGrid count={4} cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" h={232} />
        ) : popularJobs.length === 0 ? (
          <div className="empty-state">
            <Fire size={48} className="empty-icon text-slate-300" />
            <p className="empty-desc">Hozircha ma'lumot yo'q</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
            {popularJobs.map((job) => (
              <JobCard key={job._id} job={job} hot isDark={isDark} />
            ))}
          </div>
        )}
      </section>

      {/* ─── TOP FREELANCERS ──────────────────────────────────────────────── */}
      <section className="section-pad hw-bg">
        <div>
          <div className="section-head text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star size={24} weight="fill" className="text-amber-400" />
              <h2 className="h-section">Top Frilanserlar</h2>
            </div>
            <p className="t-lead">Ishonchli va tajribali mutaxassislar bilan ishlang</p>
          </div>

          {freelancersLoading ? (
            <SkeletonGrid count={5} cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" h={288} />
          ) : topFreelancers.length === 0 ? (
            <div className="empty-state">
              <UserIcon size={48} className="empty-icon text-slate-300" />
              <p className="empty-desc">Hozircha frilanserlar yo'q</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
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
      <section className="section-pad hw-bg">
        <div className="section-head text-center">
          <h2 className="h-section mb-3">Platforma paketlari</h2>
          <p className="t-lead">Ehtiyojlaringizga mos tarifni tanlang</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto items-start">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`card-flat p-8 flex flex-col relative overflow-hidden transition-all ${
                plan.popular ? 'shadow-xl md:-translate-y-4' : 'hover:shadow-xl'
              }`}
              style={{
                borderColor: plan.popular ? 'var(--primary)' : 'var(--border)',
                borderTopWidth: plan.popular ? '4px' : '1px',
              }}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full tracking-wider">
                  POPULAR
                </div>
              )}
              <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text-1)' }}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black" style={{ color: 'var(--text-1)' }}>{plan.price}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-4)' }}>{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
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
      <section className="section-pad hw-bg">
        <div className="max-w-3xl mx-auto">
          <h2 className="h-section text-center mb-10">Ko'p so'raladigan savollar</h2>
          <div className="space-y-3">
            {FAQS.map(([question, answer]) => (
              <FaqItem key={question} question={question} answer={answer} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP DOWNLOAD BANNER ──────────────────────────────────────────── */}
      <section className="section-pad hw-bg">
        <div className="bg-indigo-600 rounded-3xl p-8 sm:p-10 md:p-14 flex flex-col md:flex-row items-center gap-10 md:gap-12 overflow-hidden relative">
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="flex-1 relative z-10">
            <h2 className="text-3xl font-black text-white mb-5">Frilans doimo qo'lingizda</h2>
            <p className="text-indigo-200 text-base mb-10 leading-relaxed">
              BuFu mobil ilovasini yuklab oling va bildirishnomalarni birinchilardan bo'lib qabul qiling.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={process.env.NEXT_PUBLIC_APK_URL || 'https://bufu.uz/downloads/bufu.apk'}
                download
                className="bg-black text-white px-7 py-3.5 rounded-xl flex items-center gap-3 hover:scale-105 transition-transform"
              >
                <AndroidLogo size={28} weight="fill" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Yuklab olish</p>
                  <p className="text-base font-bold leading-none">Android (APK)</p>
                </div>
              </a>
              <button
                disabled
                className="bg-black/60 text-white px-7 py-3.5 rounded-xl flex items-center gap-3 cursor-not-allowed"
              >
                <AppleLogo size={28} weight="fill" />
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold opacity-60 tracking-widest">Tez orada</p>
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
