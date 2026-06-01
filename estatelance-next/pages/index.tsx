import React, { useEffect, useState } from 'react';
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
import { userVar } from '../apollo/store';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { Job, User } from '../libs/types';
import { JobStatus } from '../libs/enums';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';
  const isLoggedIn = mounted && !!user._id;

  const { data: jobsData, loading: jobsLoading } = useQuery(GET_JOBS, {
    variables: { input: { page: 1, limit: 20, status: JobStatus.OPEN } },
    fetchPolicy: 'cache-and-network',
  });

  const { data: freelancersData, loading: freelancersLoading } = useQuery(GET_FREELANCERS, {
    variables: { input: { page: 1, limit: 12 } },
    fetchPolicy: 'cache-and-network',
  });

  const allJobs: Job[] = jobsData?.getJobs ?? [];
  const latestJobs = allJobs.slice(0, 6);
  const popularJobs = [...allJobs]
    .sort((a, b) => (b.bidCount ?? 0) - (a.bidCount ?? 0))
    .slice(0, 6);
  const topFreelancers: User[] = [...(freelancersData?.getFreelancers ?? [])]
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 5);

  return (
    <>
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

      {/* ─── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative w-screen min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          marginLeft: 'calc(-50vw + 50%)',
          marginRight: 'calc(-50vw + 50%)',
          transition: 'background-color 0.25s ease',
        }}
      >
        {/* Glow orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Light mode decorative circles */}
        {!isDark && (
          <>
            <div className="absolute top-20 right-20 w-72 h-72 bg-indigo-100/60 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 left-20 w-56 h-56 bg-purple-100/60 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        <div className="relative z-10 max-w-3xl mx-auto w-full">
          {/* Badge */}
          <span className={`inline-block px-4 py-1.5 mb-6 rounded-full text-xs font-bold tracking-wider uppercase border backdrop-blur-sm ${
            isDark
              ? 'text-indigo-300 border-indigo-500/30 bg-white/5'
              : 'text-indigo-600 border-indigo-200 bg-indigo-50/80'
          }`}>
            O'zbekistonda 1-raqamli platforma
          </span>

          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            Build Future —{' '}
            <span className={isDark ? 'text-indigo-400' : 'text-indigo-600'}>O'zbekiston</span>{' '}
            frilanserlar platformasi
          </h1>

          <p className={`text-lg mb-10 max-w-2xl mx-auto leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Eng malakali mutaxassislarni toping yoki o'z mahoratingiz orqali daromad olishni bugundan boshlang.
            Frilans — kelajak iqtisodiyoti.
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-2xl mx-auto mb-16">
            <div className={`flex flex-col md:flex-row gap-2 p-2 rounded-xl shadow-2xl ${
              isDark ? 'bg-slate-800 shadow-black/40' : 'bg-white shadow-indigo-100/60'
            }`}>
              <div className="flex-1 flex items-center px-4 gap-3">
                <MagnifyingGlass size={20} className={isDark ? 'text-slate-400' : 'text-slate-400'} />
                <input
                  type="text"
                  placeholder="Qanday ish yoki mutaxassis kerak?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full border-none outline-none text-sm py-3 bg-transparent placeholder-slate-400 ${
                    isDark ? 'text-slate-100' : 'text-slate-900'
                  }`}
                />
              </div>
              <Link
                href={searchQuery ? `/jobs?q=${encodeURIComponent(searchQuery)}` : '/jobs'}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 no-underline"
              >
                Izlash
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-xl mx-auto border-t pt-12 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            {[
              { val: '500+', label: 'Frilanserlar' },
              { val: '1000+', label: 'Loyihalar' },
              { val: '200+', label: 'Mijozlar' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center">
                <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{s.val}</span>
                <span className={`text-xs font-bold uppercase tracking-widest mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Yo'nalishlar bo'yicha izlash</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Har qanday murakkablikdagi vazifalar uchun mutaxassislar</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES_DISPLAY.map(({ key }) => {
            const cat = CAT[key] ?? CAT.OTHER;
            return (
              <Link key={key} href={`/browse?category=${key}`} className="no-underline group">
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
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section
        className="py-24 px-6 md:px-12 overflow-hidden"
        style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1">
              <h2 className={`text-3xl font-black mb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>Platforma qanday ishlaydi?</h2>
              <div className="space-y-8">
                {[
                  {
                    num: '1',
                    title: "Ro'yxatdan o'ting",
                    desc: "Frilanser yoki mijoz sifatida o'z profilingizni yarating.",
                    icon: <GraduationCap size={22} weight="fill" />,
                  },
                  {
                    num: '2',
                    title: 'Loyihani joylashtiring',
                    desc: "Vazifa tavsifini yozing va budjetingizni belgilang.",
                    icon: <ClipboardText size={22} weight="fill" />,
                  },
                  {
                    num: '3',
                    title: 'Eng yaxshisini tanlang',
                    desc: "Nomzodlar portfoliosi va reytingini ko'rib chiqing.",
                    icon: <Star size={22} weight="fill" />,
                  },
                  {
                    num: '4',
                    title: "Xavfsiz to'lov",
                    desc: "Ish yakunlangandan so'ng tizim orqali to'lovni amalga oshiring.",
                    icon: <ShieldCheck size={22} weight="fill" />,
                  },
                ].map((step) => (
                  <div key={step.num} className="flex gap-5">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 font-black text-lg shadow-lg shadow-indigo-200">
                      {step.num}
                    </div>
                    <div>
                      <h4 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h4>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 relative">
              {/* Glow blobs */}
              <div className="absolute -top-10 -right-10 w-56 h-56 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl relative z-10"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%)' }}>

                {/* Floating cards */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">

                  {/* Top row */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex-1 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-green-400 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <span className="text-white/70 text-xs font-medium">Ish topildi</span>
                      </div>
                      <p className="text-white font-bold text-sm">3D Vizualizatsiya</p>
                      <p className="text-indigo-300 text-xs mt-0.5">$1,200 • Toshkent</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex-1 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        </div>
                        <span className="text-white/70 text-xs font-medium">Top frilanser</span>
                      </div>
                      <p className="text-white font-bold text-sm">Azizbek T.</p>
                      <p className="text-indigo-300 text-xs mt-0.5">★ 4.9 • 48 ish</p>
                    </div>
                  </div>

                  {/* Center 3D abstract */}
                  <div className="flex items-center justify-center flex-1 py-4">
                    <svg width="180" height="160" viewBox="0 0 180 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Back cube */}
                      <polygon points="90,10 150,45 150,115 90,150 30,115 30,45" fill="none" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5"/>
                      {/* Main cube top */}
                      <polygon points="90,30 130,52 90,74 50,52" fill="rgba(139,92,246,0.4)" stroke="rgba(167,139,250,0.6)" strokeWidth="1.5"/>
                      {/* Main cube left */}
                      <polygon points="50,52 90,74 90,114 50,92" fill="rgba(109,40,217,0.5)" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5"/>
                      {/* Main cube right */}
                      <polygon points="130,52 90,74 90,114 130,92" fill="rgba(124,58,237,0.6)" stroke="rgba(196,181,253,0.4)" strokeWidth="1.5"/>
                      {/* Small cube top */}
                      <polygon points="90,48 110,58 90,68 70,58" fill="rgba(196,181,253,0.5)" stroke="rgba(221,214,254,0.7)" strokeWidth="1"/>
                      {/* Small cube left */}
                      <polygon points="70,58 90,68 90,88 70,78" fill="rgba(167,139,250,0.4)" stroke="rgba(196,181,253,0.5)" strokeWidth="1"/>
                      {/* Small cube right */}
                      <polygon points="110,58 90,68 90,88 110,78" fill="rgba(139,92,246,0.5)" stroke="rgba(196,181,253,0.5)" strokeWidth="1"/>
                      {/* Floating dots */}
                      <circle cx="30" cy="35" r="4" fill="rgba(167,139,250,0.6)"/>
                      <circle cx="150" cy="35" r="3" fill="rgba(196,181,253,0.5)"/>
                      <circle cx="18" cy="80" r="2.5" fill="rgba(139,92,246,0.5)"/>
                      <circle cx="162" cy="90" r="2" fill="rgba(167,139,250,0.4)"/>
                      {/* Lines */}
                      <line x1="30" y1="35" x2="50" y2="52" stroke="rgba(167,139,250,0.3)" strokeWidth="1" strokeDasharray="3,3"/>
                      <line x1="150" y1="35" x2="130" y2="52" stroke="rgba(167,139,250,0.3)" strokeWidth="1" strokeDasharray="3,3"/>
                    </svg>
                  </div>

                  {/* Bottom stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Frilanserlar', value: '500+', color: '#a78bfa' },
                      { label: 'Ishlar',        value: '124',   color: '#34d399' },
                      { label: "Muvaffaqiyat",  value: '98%',   color: '#fbbf24' },
                    ].map((s) => (
                      <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                        <p className="text-lg font-extrabold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-white/50 text-[10px] mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LATEST JOBS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
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
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
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
      <section className="py-24" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-6 md:px-12">
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
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
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
      <section className="py-24" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="max-w-3xl mx-auto px-6">
          <h2 className={`text-3xl font-black text-center mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ko'p so'raladigan savollar</h2>
          <div className="space-y-3">
            {FAQS.map(([question, answer]) => (
              <FaqItem key={question} question={question} answer={answer} isDark={isDark} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP DOWNLOAD BANNER ──────────────────────────────────────────── */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
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
        <section className="py-8 px-6 md:px-12 max-w-7xl mx-auto pb-24">
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
    </>
  );
};

export default withLayoutBasic(HomePage);
