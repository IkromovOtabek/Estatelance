import React, { useState } from 'react';
import BoostModal from '../../libs/components/common/BoostModal';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Plus,
  Briefcase,
  ClipboardText,
  CheckCircle,
  Clock,
  XCircle,
  CurrencyDollar,
  Users,
  ArrowRight,
  Lock,
  Pencil,
  Trash,
  RocketLaunch,
  X,
} from '@phosphor-icons/react';
import { GET_MY_JOBS } from '../../apollo/user/query';
import { COMPLETE_JOB, DELETE_JOB, UPDATE_JOB, BOOST_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { Job } from '../../libs/types';
import { JobCategory, JOB_CATEGORY_LABELS, JobStatus } from '../../libs/enums';
import { getCatIcon } from '../../libs/utils/jobCategoryIcons';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  OPEN:      { label: 'Ochiq',     color: '#4f46e5', bg: '#eef2ff', icon: <Clock size={13} weight="fill" /> },
  ACTIVE:    { label: 'Faol',      color: '#0891b2', bg: '#e0f2fe', icon: <Briefcase size={13} weight="fill" /> },
  COMPLETED: { label: 'Tugagan',   color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle size={13} weight="fill" /> },
  CANCELLED: { label: 'Bekor',     color: '#dc2626', bg: '#fee2e2', icon: <XCircle size={13} weight="fill" /> },
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const ms = typeof dateStr === 'string' && /^\d+$/.test(dateStr)
    ? parseInt(dateStr) : new Date(dateStr).getTime();
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'hozirgina';
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

const MyWorksPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  const [filterStatus, setFilterStatus] = useState<string>('');

  // ── Boost modal state ───────────────────────────────────────────────────────
  const [boostJob2, setBoostJob2] = useState<Job | null>(null);

  // ── Edit modal state ────────────────────────────────────────────────────────
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

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total:      allJobs.length,
    open:       allJobs.filter(j => j.status === JobStatus.OPEN).length,
    active:     allJobs.filter(j => j.status === JobStatus.ACTIVE).length,
    completed:  allJobs.filter(j => j.status === JobStatus.COMPLETED).length,
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

  const handleBoost = (job: Job) => {
    setBoostJob2(job);
  };

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

  // ── Access guard ─────────────────────────────────────────────────────────────
  if (!user._id) {
    return (
      <Box sx={{ textAlign: 'center', py: 12 }}>
        <Lock size={40} color="#94a3b8" />
        <Typography fontSize={16} fontWeight={700} mt={2} mb={1}>Kirish talab etiladi</Typography>
        <Button variant="contained" onClick={() => router.push('/account')} sx={{ bgcolor: '#4f46e5' }}>
          Kirish
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Head><title>Mening ishlarim — BuFu</title></Head>

      {/* ── Boost Modal ───────────────────────────────────────────────────── */}
      <BoostModal
        open={!!boostJob2}
        jobTitle={boostJob2?.title ?? ''}
        onClose={() => setBoostJob2(null)}
        onConfirm={handleBoostConfirm}
      />

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <Dialog open={!!editJob} onClose={() => !editSaving && setEditJob(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>Ishni tahrirlash</Typography>
          <IconButton size="small" onClick={() => setEditJob(null)} disabled={editSaving}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Stack spacing={2.5} pt={1}>
            <TextField
              label="Sarlavha"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label="Tavsif"
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              fullWidth
              size="small"
              multiline
              rows={4}
            />
            <TextField
              label="Byudjet ($)"
              value={editBudget}
              onChange={e => setEditBudget(e.target.value)}
              fullWidth
              size="small"
              type="number"
              inputProps={{ min: 10 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditJob(null)} disabled={editSaving} sx={{ color: '#64748b' }}>
            Bekor
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSave}
            disabled={editSaving || !editTitle.trim() || !editDescription.trim()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            {editSaving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a">Mening ishlarim</Typography>
          <Typography fontSize={13} color="text.secondary">
            Siz joylagan barcha ish e'lonlari
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={18} weight="bold" />}
          onClick={() => router.push('/my-works/create')}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, fontWeight: 700 }}
        >
          Ish qo'shish
        </Button>
      </Stack>

      {/* ── Stats cards ───────────────────────────────────────────────────── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Jami ishlar',    value: stats.total,                          color: '#4f46e5', icon: <ClipboardText size={20} color="#4f46e5" weight="fill" /> },
          { label: 'Ochiq',          value: stats.open,                           color: '#4f46e5', icon: <Clock size={20} color="#4f46e5" weight="fill" /> },
          { label: 'Faol',           value: stats.active,                         color: '#0891b2', icon: <Briefcase size={20} color="#0891b2" weight="fill" /> },
          { label: 'Tugagan',        value: stats.completed,                      color: '#16a34a', icon: <CheckCircle size={20} color="#16a34a" weight="fill" /> },
          { label: 'Jami budget',    value: `$${stats.totalBudget.toLocaleString()}`, color: '#059669', icon: <CurrencyDollar size={20} color="#059669" weight="fill" /> },
          { label: 'Jami takliflar', value: stats.totalBids,                      color: '#7c3aed', icon: <Users size={20} color="#7c3aed" weight="fill" /> },
        ].map(s => (
          <Box key={s.label} sx={{
            p: 2, bgcolor: 'white', borderRadius: 2.5, border: '1px solid #e2e8f0',
            boxShadow: '0 1px 4px rgba(0,0,0,.04)',
          }}>
            <Box mb={0.5}>{s.icon}</Box>
            <Typography fontSize={24} fontWeight={900} color={s.color} lineHeight={1}>{s.value}</Typography>
            <Typography fontSize={12} color="text.secondary" mt={0.5}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* ── Filter tabs ───────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1} mb={2.5} flexWrap="wrap">
        {[
          { value: '',          label: `Hammasi (${stats.total})` },
          { value: 'OPEN',      label: `Ochiq (${stats.open})` },
          { value: 'ACTIVE',    label: `Faol (${stats.active})` },
          { value: 'COMPLETED', label: `Tugagan (${stats.completed})` },
        ].map(f => (
          <Button
            key={f.value}
            size="small"
            variant={filterStatus === f.value ? 'contained' : 'outlined'}
            onClick={() => setFilterStatus(f.value)}
            sx={{
              fontSize: 12, borderRadius: 2,
              bgcolor: filterStatus === f.value ? '#4f46e5' : 'transparent',
              borderColor: '#e2e8f0',
              color: filterStatus === f.value ? 'white' : '#64748b',
              '&:hover': { bgcolor: filterStatus === f.value ? '#4338ca' : '#f1f5f9' },
            }}
          >
            {f.label}
          </Button>
        ))}
      </Stack>

      {/* ── Jobs list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
        </Box>
      ) : jobs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'white', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <ClipboardText size={40} color="#94a3b8" />
          <Typography fontWeight={700} mt={2} mb={0.5} color="#475569">
            {filterStatus ? "Bu holatda ish yo'q" : "Hali ish joylashtirilmagan"}
          </Typography>
          {!filterStatus && (
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => router.push('/my-works/create')}
              sx={{ mt: 2, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2 }}
            >
              Birinchi ishni joylash
            </Button>
          )}
        </Box>
      ) : (
        <Stack spacing={2}>
          {jobs.map(job => {
            const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;
            const isBoosted = !!job.boostExpiresAt && new Date(job.boostExpiresAt).getTime() > Date.now();
            const canEdit   = job.status === JobStatus.OPEN;
            const canDelete = job.status !== JobStatus.ACTIVE;
            const canBoost  = job.status === JobStatus.OPEN;

            return (
              <Box key={job._id} sx={{
                bgcolor: 'white', borderRadius: 2.5,
                border: isBoosted ? '1.5px solid #7c3aed' : '1px solid #e2e8f0',
                p: 2.5, boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                transition: 'box-shadow 0.15s',
                '&:hover': { boxShadow: '0 4px 16px rgba(79,70,229,.1)' },
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.75} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={
                          <Stack direction="row" alignItems="center" spacing={0.4}>
                            {cfg.icon}<span>{cfg.label}</span>
                          </Stack>
                        }
                        sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, fontSize: 11, height: 22 }}
                      />
                      {job.category && (
                        <Chip
                          size="small"
                          icon={getCatIcon(job.category as JobCategory, 12) ?? undefined}
                          label={JOB_CATEGORY_LABELS[job.category as JobCategory] ?? job.category}
                          sx={{ fontSize: 11, height: 22, bgcolor: '#f8fafc', color: '#475569' }}
                        />
                      )}
                      {isBoosted && (
                        <Chip
                          size="small"
                          icon={<RocketLaunch size={11} color={job.boostPlan === 'VIP' ? '#b45309' : job.boostPlan === 'PRO' ? '#7c3aed' : '#4f46e5'} weight="fill" />}
                          label={job.boostPlan === 'VIP' ? '⭐ VIP Top' : job.boostPlan === 'PRO' ? '⚡ Pro Top' : '🔵 Top'}
                          sx={{ fontSize: 11, height: 22, bgcolor: job.boostPlan === 'VIP' ? '#fffbeb' : job.boostPlan === 'PRO' ? '#f5f3ff' : '#eef2ff', color: job.boostPlan === 'VIP' ? '#b45309' : job.boostPlan === 'PRO' ? '#7c3aed' : '#4f46e5', fontWeight: 700 }}
                        />
                      )}
                      <Typography fontSize={11} color="#94a3b8">{timeAgo(job.createdAt)}</Typography>
                    </Stack>

                    <Typography fontWeight={700} fontSize={15} color="#0f172a" mb={0.5} noWrap>
                      {job.title}
                    </Typography>
                    <Typography fontSize={13} color="#64748b" sx={{
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {job.description}
                    </Typography>
                  </Box>

                  <Stack alignItems="flex-end" spacing={1} flexShrink={0}>
                    <Typography fontWeight={800} fontSize={16} color="#16a34a">${job.budget}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Users size={13} color="#94a3b8" />
                      <Typography fontSize={12} color="#94a3b8">{job.bidCount ?? 0} taklif</Typography>
                    </Stack>
                    {/* Quick action icons top-right */}
                    <Stack direction="row" spacing={0.5}>
                      {canEdit && (
                        <Tooltip title="Tahrirlash">
                          <IconButton
                            size="small"
                            onClick={() => openEdit(job)}
                            sx={{ color: '#4f46e5', bgcolor: '#eef2ff', '&:hover': { bgcolor: '#e0e7ff' }, width: 28, height: 28 }}
                          >
                            <Pencil size={14} weight="bold" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canBoost && (
                        <Tooltip title="Top ga chiqazish">
                          <IconButton
                            size="small"
                            onClick={() => handleBoost(job)}
                            sx={{ color: '#7c3aed', bgcolor: '#f5f3ff', '&:hover': { bgcolor: '#ede9fe' }, width: 28, height: 28 }}
                          >
                            <RocketLaunch size={14} weight="bold" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && (
                        <Tooltip title="O'chirish">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(job)}
                            sx={{ color: '#dc2626', bgcolor: '#fef2f2', '&:hover': { bgcolor: '#fee2e2' }, width: 28, height: 28 }}
                          >
                            <Trash size={14} weight="bold" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </Stack>
                </Stack>

                {/* Actions row */}
                <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
                  <Link href={`/jobs/${job._id}`} style={{ textDecoration: 'none' }}>
                    <Button
                      size="small" variant="outlined" endIcon={<ArrowRight size={14} />}
                      sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#4f46e5', borderRadius: 1.5 }}
                    >
                      Batafsil
                    </Button>
                  </Link>
                  {canEdit && (
                    <Button
                      size="small" variant="outlined" startIcon={<Pencil size={13} />}
                      onClick={() => openEdit(job)}
                      sx={{ fontSize: 12, borderColor: '#e2e8f0', color: '#4f46e5', borderRadius: 1.5 }}
                    >
                      Tahrirlash
                    </Button>
                  )}
                  {canBoost && (
                    <Button
                      size="small" variant="outlined" startIcon={<RocketLaunch size={13} />}
                      onClick={() => handleBoost(job)}
                      sx={{ fontSize: 12, borderColor: '#ddd6fe', color: '#7c3aed', borderRadius: 1.5 }}
                    >
                      Top ga chiqazish
                    </Button>
                  )}
                  {job.status === JobStatus.ACTIVE && (
                    <Button
                      size="small" variant="contained" startIcon={<CheckCircle size={14} />}
                      onClick={() => handleComplete(job._id)}
                      sx={{ fontSize: 12, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 1.5 }}
                    >
                      Bajarildi
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      size="small" variant="outlined" startIcon={<Trash size={13} />}
                      onClick={() => handleDelete(job)}
                      sx={{ fontSize: 12, borderColor: '#fecaca', color: '#dc2626', borderRadius: 1.5, ml: 'auto' }}
                    >
                      O'chirish
                    </Button>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </>
  );
};

export default withLayoutBasic(MyWorksPage);
