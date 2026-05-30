import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  MapPin as LocationOnIcon,
  CurrencyDollar as AttachMoneyIcon,
  Clock as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Buildings as BuildingIcon,
  ArrowLeft as ArrowLeftIcon,
  Users as UsersIcon,
  Star as StarIcon,
  PaperPlane as SendIcon,
  ClipboardText,
  EnvelopeSimple,
  Briefcase,
  Tag,
  House,
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
  [JobStatus.OPEN]:      { label: 'Ochiq',         color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
  [JobStatus.ACTIVE]:    { label: 'Jarayonda',     color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  [JobStatus.COMPLETED]: { label: 'Yakunlandi',    color: '#475569', bg: '#f1f5f9', border: '#e2e8f0' },
  [JobStatus.CANCELLED]: { label: "Bekor qilindi", color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

const BID_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  [BidStatus.PENDING]:  { label: "Ko'rib chiqilmoqda", color: '#b45309', bg: '#fef3c7' },
  [BidStatus.ACCEPTED]: { label: 'Qabul qilindi',     color: '#16a34a', bg: '#dcfce7' },
  [BidStatus.DECLINED]: { label: 'Rad etildi',        color: '#dc2626', bg: '#fef2f2' },
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

  const [bidAmount, setBidAmount]   = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [bidError, setBidError]     = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);

  const { data: jobData, loading: jobLoading } = useQuery(GET_JOB_BY_ID, {
    variables: { jobId },
    skip: !jobId,
  });

  const { data: bidsData, loading: bidsLoading, refetch: refetchBids } = useQuery(GET_BIDS_FOR_JOB, {
    variables: { jobId },
    skip: !jobId || !isAgent,
  });

  const [createBid, { loading: submitting }] = useMutation(CREATE_BID);
  const [acceptBid, { loading: accepting }]  = useMutation(ACCEPT_BID);
  const [completeJob, { loading: completing }] = useMutation(COMPLETE_JOB);

  const job: Job | null  = jobData?.getJobById ?? null;
  const bids: Bid[]      = bidsData?.getBidsForJob ?? [];

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBidError('');
    const amount = Number(bidAmount);
    if (!amount || amount <= 0) { setBidError('Iltimos, to\'g\'ri taklif summasi kiriting.'); return; }
    if (!coverLetter.trim())     { setBidError('Iltimos, qopqoq xat yozing.'); return; }
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
    if (!window.confirm('Ishni yakunlandi deb belgilaysizmi? Bu amalni qaytarib bo\'lmaydi.')) return;
    await completeJob({ variables: { jobId: job._id } });
    router.reload();
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (jobLoading || !jobId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 14 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
          <Typography fontSize={13} color="text.secondary">Yuklanmoqda...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ textAlign: 'center', py: 14 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ClipboardText size={56} color="#94a3b8" />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>Ish topilmadi</Typography>
        <Typography fontSize={14} color="text.secondary" mb={3}>Bu ish o'chirilgan yoki mavjud emas</Typography>
        <Link href="/jobs">
          <Button variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2 }}>
            Barcha ishlarga qaytish
          </Button>
        </Link>
      </Box>
    );
  }

  const status = STATUS_CONFIG[job.status] ?? STATUS_CONFIG[JobStatus.OPEN];
  const isOwn = isAgent && user._id === job.agentId;

  return (
    <>
      <Head><title>{job.title} — BuFu</title></Head>

      {/* ── Breadcrumb ── */}
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <Link href="/jobs" style={{ textDecoration: 'none' }}>
          <Button
            size="small"
            startIcon={<ArrowLeftIcon size={16} />}
            sx={{ color: '#64748b', fontSize: 13, px: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}
          >
            Ishlar
          </Button>
        </Link>
        <Typography color="#cbd5e1">/</Typography>
        <Typography fontSize={13} color="#94a3b8" noWrap sx={{ maxWidth: 260 }}>{job.title}</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">

        {/* ════ CHAP: Ish tafsilotlari ════ */}
        <Box sx={{ flex: 1, minWidth: 0 }}>

          {/* Hero card */}
          <Box sx={{
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 3,
            overflow: 'hidden',
            mb: 2.5,
          }}>
            {/* Gradient header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #4f46e5 100%)',
              px: { xs: 3, md: 4 },
              pt: { xs: 3, md: 4 },
              pb: { xs: 3, md: 4 },
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative orb */}
              <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

              {/* Category + Status */}
              <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 0.75,
                  bgcolor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10, px: 1.5, py: 0.4,
                  color: '#a5b4fc', fontSize: 12, fontWeight: 600,
                }}>
                  <Box sx={{ display: 'flex' }}>{getCatIcon(job.category, 14)}</Box>
                  {JOB_CATEGORY_LABELS[job.category as JobCategory]}
                </Box>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center',
                  bgcolor: status.bg, color: status.color,
                  border: `1px solid ${status.border}`,
                  borderRadius: 10, px: 1.5, py: 0.4,
                  fontSize: 12, fontWeight: 700,
                }}>
                  {status.label}
                </Box>
              </Stack>

              <Typography
                variant="h5"
                fontWeight={800}
                color="white"
                sx={{ lineHeight: 1.3, mb: 2, fontSize: { xs: 18, md: 22 } }}
              >
                {job.title}
              </Typography>

              {/* Agent row */}
              {job.agentId && (
                <Link href={`/profile/${job.agentId}`} style={{ textDecoration: 'none' }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: 'fit-content' }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(255,255,255,0.15)', fontSize: 12, border: '1.5px solid rgba(255,255,255,0.3)' }}>
                      {job.agentName?.[0]?.toUpperCase() ?? 'A'}
                    </Avatar>
                    <Typography fontSize={13} color="rgba(255,255,255,0.75)" fontWeight={500}>
                      {job.agentName ?? 'Agent'} tomonidan joylashtirildi
                    </Typography>
                  </Stack>
                </Link>
              )}
            </Box>

            {/* Info strip — overlapping the gradient */}
            <Box sx={{
              mx: { xs: 2, md: 3 },
              mt: 2.5,
              mb: 2.5,
              p: 2.5,
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 2.5,
              boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}>
              {/* Budget */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachMoneyIcon size={18} color="#16a34a" />
                </Box>
                <Box>
                  <Typography fontSize={18} fontWeight={900} color="#0f172a" lineHeight={1}>${job.budget}</Typography>
                  <Typography fontSize={11} color="#94a3b8">byudjet</Typography>
                </Box>
              </Stack>

              <Box sx={{ width: 1, bgcolor: '#e2e8f0', alignSelf: 'stretch' }} />

              {/* Bids count */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UsersIcon size={18} color="#4f46e5" />
                </Box>
                <Box>
                  <Typography fontSize={18} fontWeight={900} color="#0f172a" lineHeight={1}>{job.bidCount}</Typography>
                  <Typography fontSize={11} color="#94a3b8">taklif</Typography>
                </Box>
              </Stack>


              <Box sx={{ width: 1, bgcolor: '#e2e8f0', alignSelf: 'stretch' }} />

              {/* Time */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AccessTimeIcon size={18} color="#64748b" />
                </Box>
                <Box>
                  <Typography fontSize={13} fontWeight={600} color="#0f172a" lineHeight={1.2}>{timeAgo(job.createdAt)}</Typography>
                  <Typography fontSize={11} color="#94a3b8">joylashtirilgan</Typography>
                </Box>
              </Stack>
            </Box>

            {/* Description */}
            <Box sx={{ px: { xs: 3, md: 4 }, py: 3 }}>
              <Typography fontWeight={700} fontSize={15} color="#0f172a" mb={1.5}>Loyiha tavsifi</Typography>
              <Typography fontSize={14} color="#475569" lineHeight={1.8} sx={{ whiteSpace: 'pre-wrap' }}>
                {job.description}
              </Typography>


              {/* Complete job button */}
              {isOwn && job.status === JobStatus.ACTIVE && (
                <Box mt={3}>
                  <Divider sx={{ mb: 2.5 }} />
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckCircleIcon size={18} />}
                    onClick={handleCompleteJob}
                    disabled={completing}
                    sx={{ borderRadius: 2, fontWeight: 600, fontSize: 13 }}
                  >
                    {completing ? 'Saqlanmoqda...' : 'Ishni yakunlandi deb belgilash'}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Takliflar (faqat ish egasiga) ── */}
          {isOwn && (
            <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              {/* Header */}
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <UsersIcon size={18} color="#4f46e5" />
                <Typography fontWeight={700} fontSize={15} color="#0f172a">
                  Takliflar
                </Typography>
                <Box sx={{
                  bgcolor: '#eef2ff', color: '#4f46e5',
                  fontSize: 11, fontWeight: 800, px: 1, py: 0.1,
                  borderRadius: 10, ml: 0.5,
                }}>
                  {job.bidCount}
                </Box>
              </Box>

              <Box sx={{ p: 3 }}>
                {bidsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
                  </Box>
                ) : bids.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                      <EnvelopeSimple size={40} color="#94a3b8" />
                    </Box>
                    <Typography fontSize={14} color="text.secondary">Hozircha taklif yo'q</Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {bids.map((bid) => {
                      const bidStatus = BID_STATUS_CONFIG[bid.status] ?? BID_STATUS_CONFIG[BidStatus.PENDING];
                      const isAccepted = bid.status === BidStatus.ACCEPTED;
                      return (
                        <Box
                          key={bid._id}
                          sx={{
                            p: 2.5,
                            border: `1px solid ${isAccepted ? '#bbf7d0' : '#e2e8f0'}`,
                            borderRadius: 2.5,
                            bgcolor: isAccepted ? '#f0fdf4' : 'white',
                            transition: 'all 0.18s',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                sx={{ width: 40, height: 40, bgcolor: '#eef2ff', color: '#4f46e5', fontSize: 16, fontWeight: 700 }}
                              >
                                {bid.freelancerName?.[0]?.toUpperCase()}
                              </Avatar>
                              <Box>
                                <Link href={`/profile/${bid.freelancerId}`} style={{ textDecoration: 'none' }}>
                                  <Typography fontWeight={700} fontSize={14} color="#0f172a"
                                    sx={{ '&:hover': { color: '#4f46e5' }, transition: 'color 0.15s' }}>
                                    {bid.freelancerName}
                                  </Typography>
                                </Link>
                                <Typography fontSize={12} color="#94a3b8">{timeAgo(bid.createdAt)}</Typography>
                              </Box>
                            </Stack>

                            <Stack alignItems="flex-end" spacing={0.5}>
                              <Typography fontWeight={900} fontSize={18} color="#4f46e5">${bid.bidAmount}</Typography>
                              <Box sx={{
                                px: 1.25, py: 0.2, borderRadius: 10,
                                bgcolor: bidStatus.bg, color: bidStatus.color,
                                fontSize: 10, fontWeight: 700,
                              }}>
                                {bidStatus.label}
                              </Box>
                            </Stack>
                          </Stack>

                          <Typography fontSize={13.5} color="#475569" lineHeight={1.7} mb={1.5}>
                            {bid.coverLetter}
                          </Typography>

                          {job.status === JobStatus.OPEN && bid.status === BidStatus.PENDING && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleAcceptBid(bid._id)}
                              disabled={accepting}
                              sx={{
                                bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                                borderRadius: 2, fontWeight: 700, fontSize: 12,
                              }}
                            >
                              <Stack direction="row" alignItems="center" spacing={0.75}>
                                <CheckCircleIcon size={15} />
                                <span>Ushbu taklifni qabul qilish</span>
                              </Stack>
                            </Button>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </Box>

        {/* ════ O'NG: Sidebar ════ */}
        <Box sx={{ width: { xs: '100%', md: 340 }, flexShrink: 0 }}>

          {/* ── Taklif berish (faqat frilanserlar, ochiq ish) ── */}
          {isFreelancer && job.status === JobStatus.OPEN && (
            <Box sx={{
              bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3,
              overflow: 'hidden', mb: 2,
            }}>
              <Box sx={{
                px: 3, py: 2,
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Briefcase size={16} color="white" />
                  <Typography fontWeight={800} fontSize={15} color="white">Taklif yuborish</Typography>
                </Stack>
                <Typography fontSize={12} color="rgba(255,255,255,0.75)" mt={0.25}>
                  O'z narx va tajribangizni ko'rsating
                </Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                {bidSuccess ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                      <Trophy size={40} color="#f59e0b" weight="fill" />
                    </Box>
                    <Typography fontWeight={700} fontSize={15} color="#0f172a" mb={0.5}>Taklif yuborildi!</Typography>
                    <Typography fontSize={13} color="text.secondary">
                      Agent tez orada siz bilan bog'lanadi
                    </Typography>
                  </Box>
                ) : (
                  <form onSubmit={handleBidSubmit}>
                    <Stack spacing={2}>
                      {bidError && (
                        <Alert severity="error" sx={{ borderRadius: 2, fontSize: 13 }}>{bidError}</Alert>
                      )}
                      <TextField
                        label="Taklif summasi ($) *"
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        fullWidth size="small"
                        required inputProps={{ min: 1 }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        InputProps={{
                          startAdornment: (
                            <AttachMoneyIcon size={18} color="#94a3b8" style={{ marginRight: 4 }} />
                          ),
                        }}
                      />
                      <TextField
                        label="Qopqoq xat *"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        fullWidth size="small"
                        multiline rows={5}
                        required
                        placeholder="O'zingiz va tajribangiz haqida yozing. Nega aynan siz bu ishga mos kelasiz?"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={submitting}
                        endIcon={submitting ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <SendIcon size={16} />}
                        sx={{
                          bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' },
                          borderRadius: 2, fontWeight: 700, py: 1.2,
                        }}
                      >
                        {submitting ? 'Yuborilmoqda...' : 'Taklif yuborish'}
                      </Button>
                    </Stack>
                  </form>
                )}
              </Box>
            </Box>
          )}

          {/* ── Login prompt ── */}
          {!isLoggedIn && (
            <Box sx={{
              bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3,
              p: 3, textAlign: 'center', mb: 2,
            }}>
              <Typography fontSize={24} mb={1.5}>🔐</Typography>
              <Typography fontSize={14} fontWeight={600} color="#0f172a" mb={0.5}>
                Taklif berish uchun kiring
              </Typography>
              <Typography fontSize={13} color="text.secondary" mb={2.5}>
                Frilanser sifatida kirib taklif yuborishingiz mumkin
              </Typography>
              <Link href="/account">
                <Button variant="contained" fullWidth sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700 }}>
                  Kirish / Ro'yxatdan o'tish
                </Button>
              </Link>
            </Box>
          )}

          {/* ── Agent info (boshqa agent uchun) ── */}
          {isAgent && !isOwn && (
            <Box sx={{
              bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 3,
              p: 2.5, mb: 2,
            }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Info size={16} color="#c2410c" />
                <Typography fontSize={13} color="#c2410c" fontWeight={600}>
                  Faqat frilanserlar taklif bera oladi
                </Typography>
              </Stack>
            </Box>
          )}

          {/* ── Ish xulosasi ── */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography fontWeight={700} fontSize={14} color="#0f172a">Ish haqida</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {([
                  { label: 'Byudjet', value: `$${job.budget}`, icon: <AttachMoneyIcon size={16} color="#16a34a" />, color: '#16a34a' },
                  { label: 'Takliflar', value: `${job.bidCount} ta`, icon: <EnvelopeSimple size={16} color="#4f46e5" />, color: '#4f46e5' },
                  { label: 'Holati', value: status.label, icon: <CheckCircleIcon size={16} color={status.color} />, color: status.color },
                  { label: 'Kategoriya', value: JOB_CATEGORY_LABELS[job.category as JobCategory], icon: <Tag size={16} color="#0f172a" />, color: '#0f172a' },
                ] as Array<{ label: string; value: string; icon: React.ReactElement; color: string }>).map(({ label, value, icon, color }) => (
                  <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ display: 'flex' }}>{icon}</Box>
                      <Typography fontSize={13} color="#64748b">{label}</Typography>
                    </Stack>
                    <Typography fontSize={13} fontWeight={700} color={color}>{value}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Stack>
    </>
  );
};

export default withLayoutBasic(JobDetailPage);
