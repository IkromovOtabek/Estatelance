import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowRight as ArrowForwardIcon,
  Star as StarIcon,
  Fire as WhatshotIcon,
  Clock as AccessTimeIcon,
  GraduationCap as SchoolIcon,
  Briefcase as WorkOutlineIcon,
  TrendUp as TrendingUpIcon,
  CurrencyDollar as MonetizationOnOutlinedIcon,
  Globe,
  CheckCircle,
  Lightning,
  Lock,
  User as UserIcon,
  ClipboardText,
  ShieldCheck,
} from '@phosphor-icons/react';
import { GET_JOBS, GET_FREELANCERS } from '../apollo/user/query';
import withLayoutBasic from '../libs/components/layout/LayoutBasic';
import { userVar } from '../apollo/store';
import { Job, User } from '../libs/types';
import { JobStatus } from '../libs/enums';
import { getCatIcon } from '../libs/utils/jobCategoryIcons';

// ─── Category meta (O'zbek label + rang) ─────────────────────────────────────
const CAT: Record<string, { label: string; bg: string; text: string }> = {
  VISUALS:     { label: 'Foto & Dron',           bg: '#fef3c7', text: '#92400e' },
  STAGING:     { label: 'Virtual Staging',       bg: '#ede9fe', text: '#5b21b6' },
  MARKETING:   { label: 'SMM & Kontent',         bg: '#dcfce7', text: '#166534' },
  LEGAL:       { label: 'Yuridik & Kadastr',     bg: '#fee2e2', text: '#991b1b' },
  RENDERING:   { label: '3D Vizualizatsiya',     bg: '#e0f2fe', text: '#075985' },
  DESIGN:      { label: 'Interyer dizayn',       bg: '#fce7f3', text: '#9d174d' },
  REPAIR:      { label: "Ta'mirlash & Remont",   bg: '#fff7ed', text: '#9a3412' },
  CLEANING:    { label: 'Tozalash',              bg: '#ecfdf5', text: '#065f46' },
  INSPECTION:  { label: "Ko'rikdan o'tkazish",   bg: '#f0f9ff', text: '#0c4a6e' },
  IT:          { label: 'IT & Dasturlash',       bg: '#f5f3ff', text: '#4c1d95' },
  TRANSLATION: { label: 'Tarjima',               bg: '#fff1f2', text: '#881337' },
  MOVING:      { label: "Ko'chish & Yuk",        bg: '#fefce8', text: '#713f12' },
  ACCOUNTING:  { label: 'Buxgalteriya',          bg: '#f0fdf4', text: '#14532d' },
  SECURITY:    { label: "Qo'riqlash",            bg: '#eff6ff', text: '#1e3a8a' },
  OTHER:       { label: 'Boshqa xizmatlar',      bg: '#f1f5f9', text: '#475569' },
};

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

// ─── Ish kartochkasi ──────────────────────────────────────────────────────────
const JobCard = ({ job, hot }: { job: Job; hot?: boolean }) => {
  const cat = CAT[job.category] ?? CAT.OTHER;
  return (
    <Link href={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          p: 2.5,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          display: 'flex',
          gap: 2,
          alignItems: 'flex-start',
          cursor: 'pointer',
          transition: 'all 0.18s',
          '&:hover': {
            borderColor: '#c7d2fe',
            boxShadow: '0 4px 18px rgba(79,70,229,0.1)',
            transform: 'translateY(-1px)',
          },
        }}
      >
        {/* Category icon */}
        <Box sx={{
          width: 44, height: 44, borderRadius: 2, bgcolor: cat.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: cat.text, flexShrink: 0,
        }}>
          {getCatIcon(job.category, 22)}
        </Box>

        {/* Content */}
        <Box flex={1} minWidth={0}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} mb={0.5}>
            <Typography
              fontWeight={700}
              fontSize={14}
              color="#0f172a"
              sx={{ lineHeight: 1.3, flex: 1 }}
              className="line-clamp-2"
            >
              {job.title}
            </Typography>
            <Typography fontWeight={800} fontSize={14} color="#4f46e5" flexShrink={0}>
              ${job.budget}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={0.5}>
            <Chip
              label={cat.label}
              size="small"
              sx={{ bgcolor: cat.bg, color: cat.text, fontSize: 10, fontWeight: 600, height: 20 }}
            />
            {hot && job.bidCount > 0 && (
              <Chip
                icon={<WhatshotIcon size={11} color="#dc2626" />}
                label={`${job.bidCount} ta taklif`}
                size="small"
                sx={{ bgcolor: '#fef2f2', color: '#dc2626', fontSize: 10, fontWeight: 700, height: 20 }}
              />
            )}
            {!hot && (
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <AccessTimeIcon size={11} color="#94a3b8" />
                <Typography fontSize={10} color="#94a3b8">{timeAgo(job.createdAt)}</Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    </Link>
  );
};

// ─── Frilanser mini kartochkasi ───────────────────────────────────────────────
const FreelancerMiniCard = ({ freelancer }: { freelancer: User }) => {
  const cat = CAT[freelancer.freelancerCategory ?? ''] ?? CAT.OTHER;
  return (
    <Link href={`/profile/${freelancer._id}`} style={{ textDecoration: 'none' }}>
      <Box
        sx={{
          p: 2.5,
          bgcolor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.18s',
          minWidth: 160,
          '&:hover': {
            borderColor: '#c7d2fe',
            boxShadow: '0 4px 18px rgba(79,70,229,0.08)',
            transform: 'translateY(-2px)',
          },
        }}
      >
        {/* Avatar */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 1.5 }}>
          <Avatar
            src={freelancer.profileImage}
            sx={{ width: 56, height: 56, border: '2px solid #e2e8f0', mx: 'auto' }}
          >
            {(freelancer.fullName ?? freelancer.username)?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{
            position: 'absolute', bottom: 2, right: 2,
            width: 12, height: 12, borderRadius: '50%',
            bgcolor: freelancer.availability === 'AVAILABLE' ? '#22c55e' : '#f59e0b',
            border: '2px solid white',
          }} />
        </Box>

        <Typography fontWeight={700} fontSize={13} color="#0f172a" noWrap sx={{ maxWidth: 140 }}>
          {freelancer.fullName ?? freelancer.username}
        </Typography>

        <Chip
          label={cat.label}
          size="small"
          sx={{ bgcolor: cat.bg, color: cat.text, fontSize: 10, fontWeight: 600, height: 18, mt: 0.5 }}
        />

        {/* Rating */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5} mt={1}>
          <StarIcon size={13} color="#f59e0b" />
          <Typography fontSize={12} fontWeight={700} color="#0f172a">
            {freelancer.averageRating?.toFixed(1) ?? '5.0'}
          </Typography>
          <Typography fontSize={11} color="#94a3b8">
            ({freelancer.completedJobCount ?? 0} ish)
          </Typography>
        </Stack>

        {freelancer.hourlyRate && (
          <Typography fontSize={12} fontWeight={700} color="#4f46e5" mt={0.5}>
            ${freelancer.hourlyRate}/soat
          </Typography>
        )}
      </Box>
    </Link>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({
  icon, title, subtitle, linkHref, linkLabel,
}: { icon?: React.ReactElement; title: string; subtitle: string; linkHref: string; linkLabel: string }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={2.5}>
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {icon && <Box sx={{ display: 'flex' }}>{icon}</Box>}
        <Typography variant="h6" fontWeight={800} color="#0f172a">{title}</Typography>
      </Stack>
      <Typography fontSize={13} color="text.secondary">{subtitle}</Typography>
    </Box>
    <Link href={linkHref} style={{ textDecoration: 'none' }}>
      <Button size="small" endIcon={<ArrowForwardIcon size={20} />}
        sx={{ color: '#4f46e5', fontSize: 13, fontWeight: 600 }}>
        {linkLabel}
      </Button>
    </Link>
  </Stack>
);

// ─── Bosh sahifa ──────────────────────────────────────────────────────────────
const HomePage = () => {
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!user._id;

  // Latest + popular jobs — same query, different sort frontend-side
  const { data: jobsData, loading: jobsLoading } = useQuery(GET_JOBS, {
    variables: { input: { page: 1, limit: 20, status: JobStatus.OPEN } },
    fetchPolicy: 'cache-and-network',
  });

  // Top freelancers
  const { data: freelancersData, loading: freelancersLoading } = useQuery(GET_FREELANCERS, {
    variables: { input: { page: 1, limit: 20 } },
    fetchPolicy: 'cache-and-network',
  });

  const allJobs: Job[] = jobsData?.getJobs ?? [];
  const latestJobs = allJobs.slice(0, 5);
  const popularJobs = [...allJobs]
    .sort((a, b) => (b.bidCount ?? 0) - (a.bidCount ?? 0))
    .slice(0, 5);
  const topFreelancers: User[] = [...(freelancersData?.getFreelancers ?? [])]
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 5);

  return (
    <>
      <Head>
        <title>BuFu — O'zbekiston frilanserlar platformasi | Ish toping yoki frilanser yollang</title>
        <meta name="description" content="BuFu — O'zbekistondagi eng yaxshi frilanserlar platformasi. IT, dizayn, foto, 3D render, yuridik va boshqa sohalarda mutaxassis toping yoki ish e'lon qiling." />
        <meta name="keywords" content="frilanser, ish, bufu, freelance, O'zbekiston, IT freelancer, dizayn, foto, 3D render, yuridik, ish topish, mutaxassis, Toshkent" />
        <link rel="canonical" href="https://bufu.uz" />
      </Head>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <Box
        sx={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)',
          borderRadius: { xs: 2, md: 4 },
          p: { xs: 4, sm: 5, md: 7 },
          mb: 5,
          position: 'relative',
          overflow: 'hidden',
          minHeight: { md: 400 },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Glow orbs */}
        <Box sx={{ position: 'absolute', top: -80, right: -80, width: 380, height: 380, borderRadius: '50%', bgcolor: '#4f46e5', opacity: 0.12, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -60, left: '35%', width: 280, height: 280, borderRadius: '50%', bgcolor: '#7c3aed', opacity: 0.1, filter: 'blur(70px)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', top: '30%', right: '10%', width: 160, height: 160, borderRadius: '50%', bgcolor: '#0ea5e9', opacity: 0.07, filter: 'blur(40px)', pointerEvents: 'none' }} />

        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          {/* Badge */}
          <Stack direction="row" flexWrap="wrap" gap={1} mb={3}>
            <Chip
              icon={<SchoolIcon size={13} />}
              label="Talabalar va yangi boshlovchilar uchun"
              size="small"
              sx={{ bgcolor: 'rgba(79,70,229,0.3)', color: '#a5b4fc', fontWeight: 700, fontSize: 11, border: '1px solid rgba(165,180,252,0.2)', '& .MuiChip-icon': { color: '#a5b4fc' } }}
            />
            <Chip
              icon={<Globe size={13} />}
              label="O'zbekiston #1 platforma"
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: '#cbd5e1', fontWeight: 600, fontSize: 11, '& .MuiChip-icon': { color: '#cbd5e1' } }}
            />
          </Stack>

          <Typography
            variant="h3"
            fontWeight={900}
            color="white"
            sx={{ mb: 2, lineHeight: 1.15, fontSize: { xs: 26, sm: 34, md: 46 } }}
          >
            Kasb-hunar o'rganib,
            <Box component="span" sx={{ color: '#818cf8' }}> pul ishlashni </Box>
            boshlang!
          </Typography>

          <Typography color="#94a3b8" fontSize={{ xs: 14, md: 16 }} mb={1.5} lineHeight={1.75} maxWidth={560}>
            Foto, 3D render, dizayn, yuridik va boshqa sohalarda — hamma uchun ish bor.
            Tajriba talab qilinmaydi: ko'nikmangizni ro'yxatga oling va bugun birinchi buyurtmangizni oling.
          </Typography>

          {/* Value chips */}
          <Stack direction="row" flexWrap="wrap" gap={1} mb={4}>
            {[
              { icon: <CheckCircle size={13} color="#a5b4fc" weight="fill" />, text: "Bepul ro'yxatdan o'tish" },
              { icon: <Lightning size={13} color="#a5b4fc" weight="fill" />, text: '24 soatda birinchi ish' },
              { icon: <Lock size={13} color="#a5b4fc" weight="fill" />, text: 'Escrow himoyalangan' },
            ].map((item) => (
              <Box key={item.text} sx={{ bgcolor: 'rgba(255,255,255,0.07)', px: 1.5, py: 0.4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {item.icon}
                  <Typography fontSize={12} color="#cbd5e1">{item.text}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Link href="/browse" style={{ textDecoration: 'none' }}>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: '#4f46e5',
                  '&:hover': { bgcolor: '#4338ca', transform: 'translateY(-1px)' },
                  px: 4, fontWeight: 700, borderRadius: 2,
                  boxShadow: '0 4px 20px rgba(79,70,229,0.45)',
                  transition: 'all 0.2s',
                }}
              >
                Frilanser bo'lish
              </Button>
            </Link>
            <Link href="/jobs" style={{ textDecoration: 'none' }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<WorkOutlineIcon />}
                sx={{
                  color: 'white', borderColor: 'rgba(255,255,255,0.3)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
                  px: 4, fontWeight: 700, borderRadius: 2,
                }}
              >
                Ishlarni ko'rish
              </Button>
            </Link>
          </Stack>
        </Box>

        {/* Hero stats — right side, desktop only */}
        <Box sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 2,
          position: 'absolute',
          right: 56,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
        }}>
          {[
            { icon: <UserIcon size={22} color="#818cf8" weight="fill" />, val: '100+', lbl: 'Faol frilanser' },
            { icon: <ClipboardText size={22} color="#818cf8" weight="fill" />, val: '200+', lbl: 'Ochiq ish' },
            { icon: <StarIcon size={22} color="#818cf8" weight="fill" />, val: '4.9', lbl: "O'rtacha reyting" },
            { icon: <ShieldCheck size={22} color="#818cf8" weight="fill" />, val: '100%', lbl: 'Xavfsiz to\'lov' },
          ].map((s) => (
            <Box key={s.lbl} sx={{
              bgcolor: 'rgba(255,255,255,0.07)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2.5,
              px: 2.5, py: 1.5,
              display: 'flex', alignItems: 'center', gap: 1.5,
              minWidth: 180,
            }}>
              <Box sx={{ display: 'flex', flexShrink: 0 }}>{s.icon}</Box>
              <Box>
                <Typography fontWeight={800} fontSize={18} color="white" lineHeight={1}>{s.val}</Typography>
                <Typography fontSize={11} color="#94a3b8">{s.lbl}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ═══════════════════ TALABA UCHUN STEPS ═══════════════════ */}
      <Box mb={5}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h6" fontWeight={800} color="#0f172a">
            Hech qanday tajriba yo'qmi? Muammo emas!
          </Typography>
          <Typography color="text.secondary" fontSize={13} mt={0.5}>
            4 ta qadamda birinchi pulingizni ishlang
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {[
            { icon: <SchoolIcon size={26} color="#4f46e5" />, step: '01', title: 'Ro\'yxatdan o\'ting', desc: 'Bepul hisob yarating. Telegram orqali 30 soniyada' },
            { icon: <WorkOutlineIcon size={26} color="#4f46e5" />, step: '02', title: 'Ko\'nikmangizni qo\'shing', desc: 'Foto, dizayn, matn yozish — har qanday mahorat yetarli' },
            { icon: <TrendingUpIcon size={26} color="#4f46e5" />, step: '03', title: 'Ishlarga ariza bering', desc: 'Mos ishni tanlang, narx taklif qiling va portfelni ko\'rsating' },
            { icon: <MonetizationOnOutlinedIcon size={26} color="#4f46e5" />, step: '04', title: 'Pul ishlang', desc: 'Escrow tizimi orqali xavfsiz to\'lov kafolatlanadi' },
          ].map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={item.step}>
              <Box sx={{
                p: 3, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0',
                height: '100%', position: 'relative', overflow: 'hidden',
                '&:hover': { borderColor: '#c7d2fe', boxShadow: '0 4px 16px rgba(79,70,229,0.08)' },
                transition: 'all 0.2s',
              }}>
                <Typography sx={{
                  position: 'absolute', top: -10, right: 10,
                  fontSize: 60, fontWeight: 900, color: '#f1f5f9', lineHeight: 1, userSelect: 'none',
                }}>
                  {item.step}
                </Typography>
                {idx < 3 && (
                  <Box sx={{
                    display: { xs: 'none', md: 'block' },
                    position: 'absolute', top: '50%', right: -16,
                    width: 32, height: 2, bgcolor: '#c7d2fe', zIndex: 2,
                  }} />
                )}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {item.icon}
                  </Box>
                  <Typography fontWeight={700} fontSize={14} mb={0.5} color="#0f172a">{item.title}</Typography>
                  <Typography fontSize={13} color="#64748b" lineHeight={1.6}>{item.desc}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══════════════════ YANGI ISH E'LONLARI ═══════════════════ */}
      <Box mb={5}>
        <SectionHeader
          title="Yangi qo'shilgan ishlar"
          subtitle="Agentlar tomonidan bugun joylashtirilgan yangi ishlar"
          linkHref="/jobs"
          linkLabel="Barcha ishlar"
        />
        {jobsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : latestJobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <ClipboardText size={40} color="#94a3b8" />
            </Box>
            <Typography color="text.secondary" fontSize={14}>Hozircha ish e'lonlari yo'q</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {latestJobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ═══════════════════ ENG MASHHUR ISHLAR ═══════════════════ */}
      <Box mb={5}>
        <SectionHeader
          icon={<WhatshotIcon size={20} color="#ef4444" weight="fill" />}
          title="Eng mashhur ishlar"
          subtitle="Eng ko'p taklif olgan va talabgir bo'lgan ish e'lonlari"
          linkHref="/jobs"
          linkLabel="Barcha ishlar"
        />
        {jobsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : popularJobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <WhatshotIcon size={40} color="#94a3b8" />
            </Box>
            <Typography color="text.secondary" fontSize={14}>Hozircha ma'lumot yo'q</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {popularJobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id}>
                <JobCard job={job} hot />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ═══════════════════ TOP FRILANSERLAR ═══════════════════ */}
      <Box mb={5}>
        <SectionHeader
          icon={<StarIcon size={18} color="#f59e0b" weight="fill" />}
          title="Top frilanserlar"
          subtitle="Yuqori reyting va muvaffaqiyatli loyihalari bor mutaxassislar"
          linkHref="/browse"
          linkLabel="Barcha frilanserlar"
        />
        {freelancersLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: '#4f46e5' }} />
          </Box>
        ) : topFreelancers.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
              <UserIcon size={40} color="#94a3b8" />
            </Box>
            <Typography color="text.secondary" fontSize={14}>Hozircha frilanserlar yo'q</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 } }}>
            {topFreelancers.map((f) => (
              <FreelancerMiniCard key={f._id} freelancer={f} />
            ))}
          </Box>
        )}
      </Box>

      {/* ═══════════════════ XIZMAT TURLARI ═══════════════════ */}
      <Box mb={5}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={2.5}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0f172a">Qaysi sohada ishlashni xohlaysiz?</Typography>
            <Typography fontSize={13} color="text.secondary">6 ta asosiy yo'nalish</Typography>
          </Box>
          <Link href="/browse" style={{ textDecoration: 'none' }}>
            <Button size="small" endIcon={<ArrowForwardIcon size={20} />} sx={{ color: '#4f46e5', fontSize: 13 }}>
              Frilanserlar
            </Button>
          </Link>
        </Stack>
        <Grid container spacing={2}>
          {Object.entries(CAT).map(([key, cat]) => (
            <Grid item xs={6} sm={4} md={2} key={key}>
              <Link href={`/browse?category=${key}`} style={{ textDecoration: 'none' }}>
                <Box sx={{
                  p: 2, borderRadius: 3, bgcolor: 'white',
                  border: '1px solid #e2e8f0', textAlign: 'center',
                  cursor: 'pointer', transition: 'all 0.18s',
                  '&:hover': { borderColor: '#c7d2fe', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(79,70,229,0.1)' },
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.75, color: cat.text }}>
                    {getCatIcon(key, 26)}
                  </Box>
                  <Typography fontWeight={700} fontSize={11} color="#0f172a" lineHeight={1.3}>{cat.label}</Typography>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ═══════════════════ CTA BANNER ═══════════════════ */}
      {!isLoggedIn && (
        <Box sx={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          borderRadius: 3, p: { xs: 4, md: 5 },
          display: 'flex', flexDirection: { xs: 'column', md: 'row' },
          alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 3,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Orb */}
          <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" fontWeight={800} color="white" mb={0.75}>
              Bugun ro'yxatdan o'ting — bepul!
            </Typography>
            <Typography color="rgba(255,255,255,0.8)" fontSize={14} maxWidth={480}>
              O'zbekistondagi professional frilanserlar bilan bog'laning.
              Talabalar, yangi boshlovchilar va tajribali frilanserlar uchun mos.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
            <Link href="/account" style={{ textDecoration: 'none' }}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                sx={{ bgcolor: 'white', color: '#4f46e5', '&:hover': { bgcolor: '#f1f5f9' }, fontWeight: 800, px: 4, borderRadius: 2, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                Frilanser bo'lish
              </Button>
            </Link>
            <Link href="/account" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" size="large"
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.06)' }, fontWeight: 700, px: 3, borderRadius: 2 }}>
                Ish joylashtirish
              </Button>
            </Link>
          </Stack>
        </Box>
      )}
    </>
  );
};

export default withLayoutBasic(HomePage);
