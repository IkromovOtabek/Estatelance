import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useReactiveVar, useQuery, useMutation } from '@apollo/client';
import {
  Avatar, Box, Button, Checkbox, Chip,
  CircularProgress, Divider, FormControlLabel,
  InputAdornment, Modal, Radio, RadioGroup,
  Snackbar, Alert, Stack, TextField, Typography,
} from '@mui/material';
import {
  MagnifyingGlass, MapPin, Clock, Users, Heart, ArrowRight,
  ClipboardText, XCircle, Funnel, Phone, ChatCircle, X,
  PaperPlaneTilt, Briefcase, CheckCircle,
} from '@phosphor-icons/react';
import { GET_JOBS } from '../../apollo/user/query';
import { SEND_MESSAGE } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Job } from '../../libs/types';
import {
  JobCategory, JOB_CATEGORY_LABELS,
  JobStatus, PropertyType, PROPERTY_TYPE_LABELS, UserType,
} from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

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
  NONE: "Tajriba kerak emas",
  JUNIOR: "1–3 yil",
  MIDDLE: "3–6 yil",
  SENIOR: "6 yildan ortiq",
};
const FORMAT_LABELS: Record<string, string> = {
  ONSITE: "Ish joyida",
  REMOTE: "Masofaviy",
  HYBRID: "Gibrid",
  TRAVELING: "Sayohat",
};

// Simulated viewer counts
const VIEWER_COUNTS: Record<string, number> = {};
function getViewers(id: string) {
  if (!VIEWER_COUNTS[id]) VIEWER_COUNTS[id] = Math.floor(Math.random() * 50) + 1;
  return VIEWER_COUNTS[id];
}

// ─── Sidebar filter section ───────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box mb={2.5}>
      <Typography fontSize={13} fontWeight={700} color="#374151" mb={1.25}>{title}</Typography>
      {children}
    </Box>
  );
}

// ─── Jobs Page ────────────────────────────────────────────────────────────────
const JobsPage = () => {
  const user = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isFreelancer = mounted && user.userType === UserType.FREELANCER;
  const isAgent      = mounted && user.userType === UserType.AGENT;

  // Filters
  const [searchInput, setSearchInput]     = useState('');
  const [search, setSearch]               = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [salaryMin, setSalaryMin]         = useState('');
  const [salaryMax, setSalaryMax]         = useState('');
  const [expLevels, setExpLevels]         = useState<string[]>([]);
  const [jobTypes, setJobTypes]           = useState<string[]>([]);
  const [formats, setFormats]             = useState<string[]>([]);
  const [contactJob, setContactJob]       = useState<Job | null>(null);
  const [requestJob, setRequestJob]       = useState<Job | null>(null);
  const [requestText, setRequestText]     = useState('');
  const [snack, setSnack]                 = useState<{ open: boolean; msg: string; type: 'success' | 'error' }>({ open: false, msg: '', type: 'success' });
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);

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
      setSnack({ open: true, msg: 'Avval tizimga kiring!', type: 'error' });
      return;
    }
    if (user._id === requestJob.agentId) {
      setSnack({ open: true, msg: 'O\'z e\'loningizga so\'rov yubora olmaysiz!', type: 'error' });
      return;
    }
    if (!requestJob.agentId) {
      setSnack({ open: true, msg: 'Ish egasi topilmadi!', type: 'error' });
      return;
    }
    try {
      await sendMessage({
        variables: { input: { receiverId: requestJob.agentId, text: requestText.trim() } },
      });
      setSnack({ open: true, msg: `"${requestJob.title}" uchun so'rov yuborildi!`, type: 'success' });
      setRequestJob(null);
    } catch (err: any) {
      console.error('[So\'rov xatosi]', err);
      const gqlCode = err?.graphQLErrors?.[0]?.extensions?.code ?? '';
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Noma\'lum xatolik';

      if (gqlCode === 'FORBIDDEN' || msg.includes('Forbidden') || msg.includes('Unauthorized') || msg.includes('jwt')) {
        setSnack({ open: true, msg: 'Tizimga kirish kerak yoki sessiyangiz tugagan. Qayta kiring.', type: 'error' });
      } else if (msg.includes('SPAM_RESTRICTED')) {
        setSnack({ open: true, msg: 'Hisobingiz cheklangan. So\'rov yuborib bo\'lmaydi.', type: 'error' });
      } else if (msg.includes('not found') || msg.includes('Not Found')) {
        setSnack({ open: true, msg: 'Foydalanuvchi topilmadi.', type: 'error' });
      } else if (err?.networkError) {
        setSnack({ open: true, msg: 'Tarmoq xatosi. Internet aloqasini tekshiring.', type: 'error' });
      } else {
        setSnack({ open: true, msg: `Xatolik: ${msg}`, type: 'error' });
      }
    }
  };

  const { data, loading } = useQuery(GET_JOBS, {
    variables: {
      input: {
        page: 1, limit: 50,
        category: filterCategory || undefined,
        status: JobStatus.OPEN,
        searchText: search || undefined,
      },
    },
    fetchPolicy: 'cache-and-network',
  });
  const allJobs: Job[] = data?.getJobs ?? [];

  // Client-side filtering
  const jobs = useMemo(() => {
    return allJobs.filter(j => {
      if (salaryMin && (j.salaryFrom ?? j.budget) < Number(salaryMin)) return false;
      if (salaryMax && (j.salaryTo ?? j.budget) > Number(salaryMax)) return false;
      if (expLevels.length && j.experienceLevel && !expLevels.includes(j.experienceLevel)) return false;
      if (jobTypes.length && j.jobType && !jobTypes.includes(j.jobType)) return false;
      if (formats.length && j.workFormat?.length) {
        if (!j.workFormat.some((f: string) => formats.includes(f))) return false;
      }
      return true;
    });
  }, [allJobs, salaryMin, salaryMax, expLevels, jobTypes, formats]);

  const toggleArr = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const resetFilters = () => {
    setSearch(''); setSearchInput('');
    setFilterCategory(''); setSalaryMin(''); setSalaryMax('');
    setExpLevels([]); setJobTypes([]); setFormats([]);
  };

  const hasFilters = search || filterCategory || salaryMin || salaryMax ||
    expLevels.length || jobTypes.length || formats.length;

  return (
    <>
      <Head><title>Ish e'lonlari — BuFu</title></Head>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

        {/* ════ LEFT SIDEBAR ════ */}
        <Box sx={{
          width: 260, flexShrink: 0,
          display: { xs: 'none', lg: 'block' },
          position: 'sticky', top: 80,
          maxHeight: 'calc(100vh - 100px)',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 },
        }}>
          <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5, p: 2.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Funnel size={16} color="#4f46e5" weight="fill" />
                <Typography fontWeight={800} fontSize={14} color="#0f172a">Filtrlar</Typography>
              </Stack>
              {hasFilters && (
                <Typography fontSize={12} color="#4f46e5" sx={{ cursor: 'pointer', fontWeight: 600 }}
                  onClick={resetFilters}>
                  Tozalash
                </Typography>
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Salary */}
            <FilterSection title="Daromad darajasi ($)">
              <Stack direction="row" spacing={1}>
                <TextField
                  placeholder="dan"
                  value={salaryMin}
                  onChange={e => setSalaryMin(e.target.value)}
                  size="small" type="number"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 13, bgcolor: '#f8fafc' } }}
                />
                <TextField
                  placeholder="gacha"
                  value={salaryMax}
                  onChange={e => setSalaryMax(e.target.value)}
                  size="small" type="number"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: 13, bgcolor: '#f8fafc' } }}
                />
              </Stack>
            </FilterSection>

            {/* Experience */}
            <FilterSection title="Ish tajribasi">
              {[
                { val: 'NONE', label: 'Tajriba kerak emas' },
                { val: 'JUNIOR', label: '1–3 yil' },
                { val: 'MIDDLE', label: '3–6 yil' },
                { val: 'SENIOR', label: '6 yildan ortiq' },
              ].map(o => (
                <FormControlLabel
                  key={o.val}
                  control={
                    <Checkbox
                      size="small"
                      checked={expLevels.includes(o.val)}
                      onChange={() => toggleArr(expLevels, setExpLevels, o.val)}
                      sx={{ py: 0.4, color: '#d1d5db', '&.Mui-checked': { color: '#4f46e5' } }}
                    />
                  }
                  label={<Typography fontSize={13} color="#374151">{o.label}</Typography>}
                  sx={{ display: 'flex', ml: 0, mb: 0.25 }}
                />
              ))}
            </FilterSection>

            {/* Job type */}
            <FilterSection title="Bandlik turi">
              {[
                { val: 'PERMANENT', label: 'Doimiy' },
                { val: 'TEMPORARY', label: 'Vaqtinchalik' },
              ].map(o => (
                <FormControlLabel
                  key={o.val}
                  control={
                    <Checkbox
                      size="small"
                      checked={jobTypes.includes(o.val)}
                      onChange={() => toggleArr(jobTypes, setJobTypes, o.val)}
                      sx={{ py: 0.4, color: '#d1d5db', '&.Mui-checked': { color: '#4f46e5' } }}
                    />
                  }
                  label={<Typography fontSize={13} color="#374151">{o.label}</Typography>}
                  sx={{ display: 'flex', ml: 0, mb: 0.25 }}
                />
              ))}
            </FilterSection>

            {/* Work format */}
            <FilterSection title="Ish formati">
              {Object.entries(FORMAT_LABELS).map(([val, label]) => (
                <FormControlLabel
                  key={val}
                  control={
                    <Checkbox
                      size="small"
                      checked={formats.includes(val)}
                      onChange={() => toggleArr(formats, setFormats, val)}
                      sx={{ py: 0.4, color: '#d1d5db', '&.Mui-checked': { color: '#4f46e5' } }}
                    />
                  }
                  label={<Typography fontSize={13} color="#374151">{label}</Typography>}
                  sx={{ display: 'flex', ml: 0, mb: 0.25 }}
                />
              ))}
            </FilterSection>

            <Divider sx={{ mb: 2 }} />

            {/* Category */}
            <FilterSection title="Kategoriya">
              <RadioGroup value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <FormControlLabel
                  value=""
                  control={<Radio size="small" sx={{ py: 0.4, color: '#d1d5db', '&.Mui-checked': { color: '#4f46e5' } }} />}
                  label={<Typography fontSize={13} color="#374151">Hammasi</Typography>}
                  sx={{ display: 'flex', ml: 0, mb: 0.25 }}
                />
                {Object.values(JobCategory).map(cat => (
                  <FormControlLabel
                    key={cat}
                    value={cat}
                    control={<Radio size="small" sx={{ py: 0.4, color: '#d1d5db', '&.Mui-checked': { color: '#4f46e5' } }} />}
                    label={
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        <Box sx={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>{getCatIcon(cat, 13)}</Box>
                        <Typography fontSize={13} color="#374151">{JOB_CATEGORY_LABELS[cat]}</Typography>
                      </Stack>
                    }
                    sx={{ display: 'flex', ml: 0, mb: 0.25 }}
                  />
                ))}
              </RadioGroup>
            </FilterSection>
          </Box>
        </Box>

        {/* ════ MAIN CONTENT ════ */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Search bar */}
          <Stack direction="row" spacing={1.5} mb={2.5}>
            <TextField
              placeholder="Kasb, lavozim yoki kompaniya"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlass size={18} color="#94a3b8" />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <XCircle size={16} color="#94a3b8" style={{ cursor: 'pointer' }}
                      onClick={() => { setSearchInput(''); setSearch(''); }} />
                  </InputAdornment>
                ) : null,
              }}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, fontSize: 14 } }}
            />
            <Button
              variant="contained"
              onClick={() => setSearch(searchInput)}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, px: 3, fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              Qidirish
            </Button>
          </Stack>

          {/* Result count */}
          <Box mb={2}>
            <Typography fontWeight={800} fontSize={18} color="#0f172a">
              {loading ? '...' : `Topildi ${jobs.length} ta ish`}
              {search && <> «{search}»</>}
            </Typography>
            {filterCategory && (
              <Typography fontSize={13} color="#4f46e5" mt={0.25}>
                {JOB_CATEGORY_LABELS[filterCategory as JobCategory]} bo'yicha
              </Typography>
            )}
          </Box>

          {/* Mobile category chips */}
          <Box sx={{
            display: { xs: 'flex', lg: 'none' }, gap: 1, mb: 2,
            overflowX: 'auto', pb: 0.5,
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            {[{ val: '', label: 'Hammasi' }, ...Object.values(JobCategory).map(c => ({ val: c, label: JOB_CATEGORY_LABELS[c] }))].map(c => (
              <Chip
                key={c.val}
                label={c.val ? JOB_CATEGORY_LABELS[c.val as JobCategory] : 'Hammasi'}
                onClick={() => setFilterCategory(c.val)}
                size="small"
                sx={{
                  flexShrink: 0, fontWeight: 600, fontSize: 12,
                  bgcolor: filterCategory === c.val ? '#4f46e5' : 'white',
                  color: filterCategory === c.val ? 'white' : '#64748b',
                  border: '1px solid',
                  borderColor: filterCategory === c.val ? '#4f46e5' : '#e2e8f0',
                }}
              />
            ))}
          </Box>

          {/* Job list */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress sx={{ color: '#4f46e5' }} />
            </Box>
          ) : jobs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 12, bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 2.5 }}>
              <ClipboardText size={44} color="#94a3b8" />
              <Typography fontWeight={700} mt={2} mb={0.5} color="#475569">Ish topilmadi</Typography>
              <Typography fontSize={13} color="#94a3b8">Boshqa filter yoki kalit so'z sinab ko'ring</Typography>
              {hasFilters && (
                <Button onClick={resetFilters} variant="outlined" size="small"
                  sx={{ mt: 2, borderRadius: 2, borderColor: '#e2e8f0', color: '#4f46e5' }}>
                  Filtrlarni tozalash
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={0}>
              {jobs.map((job, idx) => {
                const viewers = getViewers(job._id);
                const isOwn = isAgent && user._id === job.agentId;
                return (
                  <Box
                    key={job._id}
                    sx={{
                      bgcolor: 'white',
                      borderTop: idx === 0 ? '1px solid #e2e8f0' : 'none',
                      borderBottom: '1px solid #e2e8f0',
                      borderLeft: '4px solid transparent',
                      borderRight: '1px solid #e2e8f0',
                      borderRadius: idx === 0 ? '10px 10px 0 0' : idx === jobs.length - 1 ? '0 0 10px 10px' : 0,
                      px: 3, py: 2.5,
                      transition: 'border-left-color 0.15s, box-shadow 0.15s',
                      '&:hover': {
                        borderLeftColor: '#4f46e5',
                        boxShadow: '2px 0 12px rgba(79,70,229,0.07)',
                        zIndex: 1,
                        position: 'relative',
                      },
                    }}
                  >
                    {/* Viewers */}
                    <Typography fontSize={12} color="#94a3b8" mb={1}>
                      Hozir {viewers} kishi ko'rmoqda
                    </Typography>

                    {/* Title row */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
                      <Box flex={1}>
                        <Link href={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                          <Typography
                            fontWeight={700}
                            fontSize={17}
                            sx={{
                              color: '#1a56db',
                              '&:hover': { color: '#1e40af' },
                              cursor: 'pointer',
                              lineHeight: 1.35,
                            }}
                          >
                            {job.title}
                          </Typography>
                        </Link>

                        {/* Salary */}
                        {(job.salaryFrom || job.salaryTo || job.budget) && (
                          <Typography fontWeight={700} fontSize={14} color="#0f172a" mt={0.5}>
                            {job.salaryFrom && job.salaryTo
                              ? `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`
                              : job.salaryFrom
                              ? `$${job.salaryFrom.toLocaleString()} dan`
                              : job.salaryTo
                              ? `$${job.salaryTo.toLocaleString()} gacha`
                              : `$${job.budget}`}
                            {' '}
                            <Typography component="span" fontSize={13} color="#94a3b8" fontWeight={400}>
                              / oy
                            </Typography>
                          </Typography>
                        )}
                      </Box>

                      {/* Favorite */}
                      <Heart size={20} color="#d1d5db" style={{ cursor: 'pointer', flexShrink: 0, marginTop: 2 }} />
                    </Stack>

                    {/* Meta chips */}
                    <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1.25}>
                      {job.experienceLevel && (
                        <Chip
                          label={EXP_LABELS[job.experienceLevel] ?? job.experienceLevel}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 11.5, fontWeight: 500, height: 24, borderRadius: 1.5 }}
                        />
                      )}
                      {job.jobType && (
                        <Chip
                          label={job.jobType === 'PERMANENT' ? 'Doimiy bandlik' : 'Vaqtinchalik'}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 11.5, fontWeight: 500, height: 24, borderRadius: 1.5 }}
                        />
                      )}
                      {[job.workFormat ?? ''].filter(Boolean).map((f: string) => (
                        <Chip
                          key={f}
                          label={FORMAT_LABELS[f] ?? f}
                          size="small"
                          sx={{ bgcolor: '#f1f5f9', color: '#475569', fontSize: 11.5, fontWeight: 500, height: 24, borderRadius: 1.5 }}
                        />
                      ))}
                      {!job.experienceLevel && !job.jobType && (
                        <Chip
                          icon={<Box sx={{ display: 'flex', ml: 0.5 }}>{getCatIcon(job.category, 11)}</Box>}
                          label={JOB_CATEGORY_LABELS[job.category as JobCategory]}
                          size="small"
                          sx={{ bgcolor: '#eef2ff', color: '#4f46e5', fontSize: 11.5, fontWeight: 600, height: 24, borderRadius: 1.5 }}
                        />
                      )}
                    </Stack>

                    {/* Agent info */}
                    {job.agentId && (
                      <Link href={`/profile/${job.agentId}`} style={{ textDecoration: 'none' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mt={1.5}
                          sx={{ width: 'fit-content', '&:hover .aname': { color: '#4f46e5' } }}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: 11, bgcolor: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}>
                            {job.agentName?.[0]?.toUpperCase() ?? 'A'}
                          </Avatar>
                          <Typography className="aname" fontSize={13} color="#374151" fontWeight={600}
                            sx={{ transition: 'color 0.15s' }}>
                            {job.agentName ?? 'Agent'}
                          </Typography>
                          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography fontSize={9} color="white" fontWeight={900}>✓</Typography>
                          </Box>
                        </Stack>
                      </Link>
                    )}

                    {/* Location + time */}
                    <Stack direction="row" alignItems="center" spacing={2} mt={1}>
                      {job.location && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <MapPin size={13} color="#94a3b8" />
                          <Typography fontSize={13} color="#64748b">{job.location}</Typography>
                        </Stack>
                      )}
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Users size={13} color="#94a3b8" />
                        <Typography fontSize={13} color="#64748b">{job.bidCount} ta taklif</Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Clock size={13} color="#94a3b8" />
                        <Typography fontSize={13} color="#94a3b8">{timeAgo(job.createdAt)}</Typography>
                      </Stack>
                    </Stack>

                    {/* Actions */}
                    <Stack direction="row" spacing={1.5} mt={2}>
                      {isOwn ? (
                        <Chip label="Sizning ishingiz" size="small"
                          sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 600 }} />
                      ) : isFreelancer ? (
                        <>
                          <Link href={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                            <Button variant="contained" size="small"
                              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 1.5, fontWeight: 700, fontSize: 13, px: 2.5 }}>
                              Murojaat qilish
                            </Button>
                          </Link>
                          <Button
                            variant="outlined" size="small"
                            startIcon={<PaperPlaneTilt size={14} weight="fill" />}
                            onClick={() => openRequestModal(job)}
                            sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 13, borderColor: '#6366f1', color: '#6366f1', px: 2,
                              '&:hover': { bgcolor: '#eef2ff', borderColor: '#4f46e5' } }}>
                            So'rov
                          </Button>
                          <Button variant="outlined" size="small"
                            onClick={() => setContactJob(job)}
                            sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 13, borderColor: '#c7d2fe', color: '#4f46e5', px: 2 }}>
                            Aloqa
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" size="small" endIcon={<ArrowRight size={14} />}
                              sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 13, borderColor: '#c7d2fe', color: '#4f46e5', px: 2 }}>
                              Ko'rish
                            </Button>
                          </Link>
                          <Button
                            variant="outlined" size="small"
                            startIcon={<PaperPlaneTilt size={14} weight="fill" />}
                            onClick={() => openRequestModal(job)}
                            sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 13, borderColor: '#6366f1', color: '#6366f1', px: 2,
                              '&:hover': { bgcolor: '#eef2ff', borderColor: '#4f46e5' } }}>
                            So'rov
                          </Button>
                          <Button variant="outlined" size="small"
                            onClick={() => setContactJob(job)}
                            sx={{ borderRadius: 1.5, fontWeight: 600, fontSize: 13, borderColor: '#c7d2fe', color: '#4f46e5', px: 2 }}>
                            Aloqa
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── So'rov jo'natish Modal ──────────────────────────────────────── */}
      <Modal open={!!requestJob} onClose={() => !sending && setRequestJob(null)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '92vw', sm: 480 },
          bgcolor: 'white', borderRadius: 4,
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          overflow: 'hidden', outline: 'none',
        }}>
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            px: 3, py: 2.5,
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <PaperPlaneTilt size={18} color="white" weight="fill" />
                <Typography fontWeight={800} fontSize={15} color="white">So'rov jo'natish</Typography>
              </Stack>
              <Typography fontSize={12} color="rgba(255,255,255,0.8)" sx={{
                maxWidth: 340,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {requestJob?.title}
              </Typography>
            </Box>
            <Box onClick={() => !sending && setRequestJob(null)}
              sx={{ cursor: 'pointer', color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' }, display: 'flex', mt: 0.25 }}>
              <X size={20} />
            </Box>
          </Box>

          {/* Job info strip */}
          <Box sx={{ bgcolor: '#f8fafc', px: 3, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Briefcase size={13} color="#6366f1" weight="fill" />
                <Typography fontSize={12} color="#475569" fontWeight={600}>
                  {requestJob?.agentName ?? 'Ish beruvchi'}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography fontSize={12} color="#64748b">💰</Typography>
                <Typography fontSize={12} color="#475569" fontWeight={600}>${requestJob?.budget}</Typography>
              </Stack>
              {requestJob?.location && (
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <MapPin size={13} color="#94a3b8" />
                  <Typography fontSize={12} color="#64748b">{requestJob.location}</Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Body */}
          <Box sx={{ px: 3, py: 2.5 }}>
            <Typography fontSize={12} fontWeight={700} color="#374151" mb={1}>
              Xabar matni (tahrirlash mumkin)
            </Typography>
            <TextField
              fullWidth multiline rows={7}
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
              placeholder="Xabaringizni yozing..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2, fontSize: 13, lineHeight: 1.7,
                  bgcolor: '#fafafa',
                  '&:hover fieldset': { borderColor: '#a5b4fc' },
                  '&.Mui-focused fieldset': { borderColor: '#6366f1' },
                },
              }}
            />
            <Typography fontSize={11} color="#94a3b8" mt={0.75}>
              {requestText.length} / 1000 belgi
            </Typography>
          </Box>

          {/* Footer buttons */}
          <Box sx={{ px: 3, pb: 3, pt: 0 }}>
            <Stack direction="row" spacing={1.5}>
              <Button
                fullWidth variant="outlined"
                onClick={() => setRequestJob(null)}
                disabled={sending}
                sx={{ borderRadius: 2, fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b',
                  '&:hover': { borderColor: '#c7d2fe', color: '#4f46e5' } }}>
                Bekor qilish
              </Button>
              <Button
                fullWidth variant="contained"
                startIcon={sending ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <PaperPlaneTilt size={16} weight="fill" />}
                onClick={handleSendRequest}
                disabled={sending || !requestText.trim()}
                sx={{
                  bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                  borderRadius: 2, fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                  '&:disabled': { bgcolor: '#c7d2fe' },
                }}>
                {sending ? 'Yuborilmoqda...' : "So'rov yuborish"}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Modal>

      {/* ── Aloqa Modal ───────────────────────────────────────────────────── */}
      <Modal open={!!contactJob} onClose={() => setContactJob(null)}>
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 400 },
          bgcolor: 'white', borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
          outline: 'none',
        }}>
          {/* Header */}
          <Box sx={{
            px: 3, pt: 3, pb: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar
                sx={{
                  width: 44, height: 44, bgcolor: '#6366f1',
                  fontWeight: 700, fontSize: 16,
                }}
              >
                {contactJob?.agentName?.charAt(0) ?? 'A'}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize={15} color="#0f172a">
                  {contactJob?.agentName ?? 'Ish beruvchi'}
                </Typography>
                <Typography fontSize={12} color="#64748b">Ish beruvchi</Typography>
              </Box>
            </Stack>
            <Box
              onClick={() => setContactJob(null)}
              sx={{ cursor: 'pointer', color: '#94a3b8', '&:hover': { color: '#475569' }, display: 'flex' }}
            >
              <X size={20} />
            </Box>
          </Box>

          <Divider />

          {/* Body */}
          <Box sx={{ px: 3, py: 2.5 }}>
            {/* Info message */}
            <Box sx={{
              bgcolor: '#f8fafc', borderRadius: 2.5, p: 2, mb: 2,
              border: '1px solid #e2e8f0',
            }}>
              <Typography fontSize={13} color="#475569" lineHeight={1.65}>
                Himoyalangan telefon raqamlari faqat qo'ng'iroqlar uchun.
                Xabarlar va SMS xabarlar qabul qilinmaydi.
              </Typography>
            </Box>

            {/* Phone number */}
            <Box sx={{
              bgcolor: '#f8fafc', borderRadius: 2.5, p: 2, mb: 2,
              border: '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box>
                <Typography fontSize={11} color="#94a3b8" fontWeight={600} mb={0.25}>
                  Asosiy telefon
                </Typography>
                <Typography fontSize={16} fontWeight={700} color="#0f172a">
                  {contactJob?.agentPhone ?? '+998 90 000-00-00'}
                </Typography>
              </Box>
              <Box
                component="a"
                href={`tel:${contactJob?.agentPhone ?? ''}`}
                sx={{
                  width: 44, height: 44, borderRadius: '50%',
                  bgcolor: '#eef2ff', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', textDecoration: 'none',
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#6366f1', '& svg': { color: 'white' } },
                }}
              >
                <Phone size={20} color="#6366f1" weight="fill" />
              </Box>
            </Box>

            {/* Chat button */}
            <Button
              fullWidth
              variant="contained"
              startIcon={<ChatCircle size={18} weight="fill" />}
              onClick={() => {
                setContactJob(null);
                window.dispatchEvent(new CustomEvent('openChat', {
                  detail: {
                    userId: contactJob?.agentId,
                    userName: contactJob?.agentName ?? 'Ish beruvchi',
                    avatar: contactJob?.agentAvatar,
                  },
                }));
              }}
              sx={{
                bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                borderRadius: 2.5, py: 1.5, fontWeight: 700, fontSize: 14,
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              Chatga yozing
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ px: 3, pb: 2.5, pt: 0 }}>
            <Typography fontSize={11} color="#94a3b8" textAlign="center">
              Ishni ko'rish:{' '}
              <Box component="span" sx={{ color: '#6366f1', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => { setContactJob(null); }}>
                <Link href={`/jobs/${contactJob?._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {contactJob?.title}
                </Link>
              </Box>
            </Typography>
          </Box>
        </Box>
      </Modal>
      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.type}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          icon={snack.type === 'success' ? <CheckCircle size={18} weight="fill" /> : undefined}
          sx={{ borderRadius: 2.5, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default withLayoutBasic(JobsPage);
