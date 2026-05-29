import React, { useEffect, useRef, useState } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Star as StarIcon,
  MapPin as LocationOnIcon,
  UserPlus as PersonAddIcon,
  UserMinus as PersonRemoveIcon,
  Chat as MessageIcon,
  PencilSimple as EditIcon,
  Plus as AddIcon,
  Trash as DeleteIcon,
  FloppyDisk as SaveIcon,
  Camera as PhotoCameraIcon,
  Briefcase as WorkIcon,
  Eye as EyeIcon,
  Users as FollowersIcon,
  ArrowLeft as ArrowLeftIcon,
  User as UserIcon,
  CheckCircle,
  Timer,
  Image as ImageIcon,
} from '@phosphor-icons/react';
import { GET_USER_BY_ID, GET_MY_PROFILE, CHECK_IS_FOLLOWING } from '../../apollo/user/query';
import { TOGGLE_FOLLOW, UPDATE_PROFILE } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { User } from '../../libs/types';
import { FreelancerAvailability, JOB_CATEGORY_LABELS, JobCategory, UserType } from '../../libs/enums';

interface PortfolioItem { title: string; imageUrl: string; description: string; }

const ProfilePage = () => {
  const router = useRouter();
  const userId = router.query.id as string;
  const currentUser = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn   = mounted && !!currentUser._id;
  const isOwnProfile = mounted && currentUser._id === userId;
  const isFreelancer = isOwnProfile && currentUser.userType === UserType.FREELANCER;

  const [followLoading, setFollowLoading]             = useState(false);
  const [isFollowing, setIsFollowing]                 = useState(false);
  const [localFollowerCount, setLocalFollowerCount]   = useState<number | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen]             = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [saveError, setSaveError]           = useState('');
  const [saveSuccess, setSaveSuccess]       = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const [portfolioUploadingIdx, setPortfolioUploadingIdx] = useState<number | null>(null);

  // Edit form fields
  const [fullName, setFullName]                 = useState('');
  const [bio, setBio]                           = useState('');
  const [location, setLocation]                 = useState('');
  const [profileImage, setProfileImage]         = useState('');
  const [availability, setAvailability]         = useState<FreelancerAvailability>(FreelancerAvailability.AVAILABLE);
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [hourlyRate, setHourlyRate]             = useState('');
  const [skillInput, setSkillInput]             = useState('');
  const [skills, setSkills]                     = useState<string[]>([]);
  const [portfolio, setPortfolio]               = useState<PortfolioItem[]>([]);

  // Queries
  const { data, loading, refetch } = useQuery(GET_USER_BY_ID, { variables: { userId }, skip: !userId });
  const { data: myProfileData }    = useQuery(GET_MY_PROFILE, { skip: !isOwnProfile, fetchPolicy: 'network-only' });
  const { data: followCheckData }  = useQuery(CHECK_IS_FOLLOWING, {
    variables: { targetUserId: userId },
    skip: !isLoggedIn || !userId || isOwnProfile,
    fetchPolicy: 'network-only',
  });

  const [toggleFollow]  = useMutation(TOGGLE_FOLLOW);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  const profile: User | null = data?.getUserById ?? null;

  React.useEffect(() => {
    if (followCheckData?.checkIsFollowing !== undefined) setIsFollowing(followCheckData.checkIsFollowing);
  }, [followCheckData]);

  React.useEffect(() => {
    if (profile) setLocalFollowerCount(null);
  }, [profile?._id]);

  React.useEffect(() => {
    if (router.isReady && router.query.onboard === 'true' && isOwnProfile && profile && !editOpen) {
      openEditDialog();
      router.replace(`/profile/${userId}`, undefined, { shallow: true });
    }
  }, [router.isReady, router.query.onboard, isOwnProfile, profile]);

  const openEditDialog = () => {
    const p = myProfileData?.getMyProfile ?? profile;
    if (p) {
      setFullName(p.fullName ?? '');
      setBio(p.bio ?? '');
      setLocation(p.location ?? '');
      setProfileImage(p.profileImage ?? '');
      setAvailability((p.availability as FreelancerAvailability) ?? FreelancerAvailability.AVAILABLE);
      setFreelancerCategory(p.freelancerCategory ?? '');
      setHourlyRate(p.hourlyRate ? String(p.hourlyRate) : '');
      setSkills(p.skills ?? []);
      setPortfolio((p.portfolio ?? []).map((item: any) => ({
        title: item.title ?? '',
        imageUrl: item.imageUrl ?? '',
        description: item.description ?? '',
      })));
    }
    setSaveError(''); setSaveSuccess(''); setEditOpen(true);
  };

  const handleAvatarPick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const base64 = await readFile(file);
      const compressed = await compressImage(base64, 400, 0.82);
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: compressed, fileName: file.name }) });
      const json = await res.json();
      if (json.url) setProfileImage(json.url);
      else setSaveError('Rasm yuklashda xatolik. Qayta urinib ko\'ring.');
    } catch { setSaveError('Rasm yuklashda xatolik.'); }
    finally { setAvatarUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const readFile = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const compressImage = (base64: string, maxSize: number, quality: number): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });

  const addSkill = () => {
    const s = skillInput.trim();
    if (!s || skills.includes(s)) return;
    setSkills(prev => [...prev, s]);
    setSkillInput('');
  };

  const addPortfolioItem = () => setPortfolio(p => [...p, { title: '', imageUrl: '', description: '' }]);
  const updatePortfolioItem = (i: number, field: keyof PortfolioItem, val: string) =>
    setPortfolio(p => p.map((item, idx) => idx === i ? { ...item, [field]: val } : item));
  const removePortfolioItem = (i: number) => setPortfolio(p => p.filter((_, idx) => idx !== i));

  const handlePortfolioImagePick = (idx: number) => {
    setPortfolioUploadingIdx(idx);
    portfolioFileInputRef.current?.click();
  };

  const handlePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = portfolioUploadingIdx;
    if (!file || idx === null) return;
    try {
      const base64 = await readFile(file);
      const compressed = await compressImage(base64, 800, 0.82);
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: compressed, fileName: file.name }) });
      const json = await res.json();
      if (json.url) updatePortfolioItem(idx, 'imageUrl', json.url);
      else setSaveError('Portfel rasmi yuklanmadi. Qayta urinib ko\'ring.');
    } catch { setSaveError('Portfel rasmi yuklanmadi.'); }
    finally { setPortfolioUploadingIdx(null); if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = ''; }
  };

  const handleSave = async () => {
    setSaveError(''); setSaveSuccess(''); setSaving(true);
    const input: any = {};
    if (fullName.trim())  input.fullName = fullName.trim();
    if (bio.trim() !== undefined) input.bio = bio.trim();
    if (location.trim())  input.location = location.trim();
    if (profileImage)     input.profileImage = profileImage;
    if (isFreelancer) {
      input.availability = availability;
      if (freelancerCategory) input.freelancerCategory = freelancerCategory;
      if (hourlyRate && !isNaN(Number(hourlyRate))) input.hourlyRate = Number(hourlyRate);
      input.skills = skills;
      input.portfolio = portfolio.filter(p => p.title.trim() && p.imageUrl.trim())
        .map(p => ({ title: p.title.trim(), imageUrl: p.imageUrl.trim(), description: p.description.trim() }));
    }
    try {
      const result = await updateProfile({ variables: { input } });
      const updated = result?.data?.updateProfile;
      if (updated) {
        userVar({ ...currentUser, fullName: updated.fullName ?? currentUser.fullName, profileImage: updated.profileImage ?? currentUser.profileImage });
      }
      setSaveSuccess('Saqlandi!');
      refetch();
      setTimeout(() => { setEditOpen(false); setSaveSuccess(''); }, 1200);
    } catch (err: any) {
      setSaveError(err?.graphQLErrors?.[0]?.message ?? 'Saqlashda xatolik. Qayta urinib ko\'ring.');
    } finally { setSaving(false); }
  };

  const handleToggleFollow = async () => {
    if (!isLoggedIn || !profile) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    const currentCount = localFollowerCount ?? profile.followerCount ?? 0;
    setLocalFollowerCount(wasFollowing ? currentCount - 1 : currentCount + 1);
    try {
      await toggleFollow({ variables: { targetUserId: profile._id } });
      refetch();
    } catch {
      setIsFollowing(wasFollowing);
      setLocalFollowerCount(currentCount);
    } finally { setFollowLoading(false); }
  };

  const handleMessageClick = () => {
    if (!profile) return;
    // Open floating chat widget instead of navigating to full messages page
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: {
        userId: profile._id,
        userName: profile.fullName ?? profile.username,
        avatar: profile.profileImage,
      },
    }));
  };

  // Loading
  if (loading || !userId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 14 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress sx={{ color: '#4f46e5' }} />
          <Typography fontSize={13} color="text.secondary">Profil yuklanmoqda...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', py: 14 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <UserIcon size={56} color="#94a3b8" />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1}>Foydalanuvchi topilmadi</Typography>
        <Typography fontSize={14} color="text.secondary" mb={3}>Bu profil o'chirilgan yoki mavjud emas</Typography>
        <Link href="/browse">
          <Button variant="contained" sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2 }}>
            Frilanserlarni ko'rish
          </Button>
        </Link>
      </Box>
    );
  }

  const categoryLabel = profile.freelancerCategory ? JOB_CATEGORY_LABELS[profile.freelancerCategory as JobCategory] : null;
  const isAvailable   = profile.availability === FreelancerAvailability.AVAILABLE;
  const displayFollowerCount = localFollowerCount ?? profile.followerCount ?? 0;

  // ─── Skill badge colors ────────────────────────────────────────────────────
  const SKILL_COLORS = [
    { bg: '#eef2ff', color: '#4338ca' },
    { bg: '#f0fdf4', color: '#166534' },
    { bg: '#fff7ed', color: '#9a3412' },
    { bg: '#fdf4ff', color: '#7e22ce' },
    { bg: '#ecfdf5', color: '#065f46' },
    { bg: '#eff6ff', color: '#1e40af' },
  ];

  return (
    <>
      <Head><title>{profile.fullName ?? profile.username} — BuFu</title></Head>

      {/* ── Back link ── */}
      <Box mb={2}>
        <Button
          size="small"
          startIcon={<ArrowLeftIcon size={16} />}
          onClick={() => router.back()}
          sx={{ color: '#64748b', fontSize: 13, px: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' } }}
        >
          Orqaga
        </Button>
      </Box>

      <Grid container spacing={3} alignItems="flex-start">

        {/* ════ CHAP: Profil kartasi ════ */}
        <Grid item xs={12} md={4}>

          {/* Profile card */}
          <Box sx={{
            bgcolor: 'white', border: '1px solid #e2e8f0',
            borderRadius: 3, overflow: 'hidden',
            mb: 2,
          }}>
            {/* Gradient header */}
            <Box sx={{
              height: 100,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 60%, #7c3aed 100%)',
              position: 'relative',
            }}>
              {isOwnProfile && (
                <Tooltip title="Profilni tahrirlash">
                  <IconButton
                    onClick={openEditDialog}
                    sx={{
                      position: 'absolute', top: 10, right: 10,
                      bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                      width: 32, height: 32,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                    }}
                  >
                    <EditIcon size={16} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
              {/* Avatar */}
              <Box sx={{ mt: -5, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    src={profile.profileImage}
                    sx={{
                      width: 80, height: 80,
                      border: '3px solid white',
                      bgcolor: '#4f46e5', fontSize: 28, fontWeight: 700,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                      cursor: isOwnProfile ? 'pointer' : 'default',
                    }}
                    onClick={isOwnProfile ? openEditDialog : undefined}
                  >
                    {(profile.fullName ?? profile.username)?.[0]?.toUpperCase()}
                  </Avatar>
                  {/* Availability dot */}
                  <Box sx={{
                    position: 'absolute', bottom: 4, right: 4,
                    width: 14, height: 14, borderRadius: '50%',
                    bgcolor: isAvailable ? '#22c55e' : '#f59e0b',
                    border: '2.5px solid white',
                    boxShadow: isAvailable ? '0 0 0 3px rgba(34,197,94,0.2)' : '0 0 0 3px rgba(245,158,11,0.2)',
                  }} />
                </Box>

                {/* Availability badge */}
                <Box sx={{
                  px: 1.5, py: 0.5, borderRadius: 10,
                  bgcolor: isAvailable ? '#f0fdf4' : '#fef9c3',
                  border: `1px solid ${isAvailable ? '#bbf7d0' : '#fde68a'}`,
                  color: isAvailable ? '#16a34a' : '#d97706',
                  fontSize: 12, fontWeight: 700,
                }}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {isAvailable ? <CheckCircle size={13} weight="fill" /> : <Timer size={13} weight="fill" />}
                    <span>{isAvailable ? "Bo'sh" : 'Band'}</span>
                  </Stack>
                </Box>
              </Box>

              {/* Name */}
              <Typography variant="h6" fontWeight={800} color="#0f172a" mb={0.25}>
                {profile.fullName ?? profile.username}
              </Typography>
              <Typography fontSize={13} color="#94a3b8" mb={1}>@{profile.username}</Typography>

              {/* Category */}
              {categoryLabel && (
                <Chip
                  label={categoryLabel}
                  size="small"
                  sx={{ bgcolor: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 600, mb: 1.5 }}
                />
              )}

              {/* Location */}
              {profile.location && (
                <Stack direction="row" alignItems="center" spacing={0.5} mb={1.5}>
                  <LocationOnIcon size={14} color="#94a3b8" />
                  <Typography fontSize={13} color="#64748b">{profile.location}</Typography>
                </Stack>
              )}

              {/* Bio */}
              {profile.bio && (
                <Typography fontSize={13} color="#475569" lineHeight={1.65} mb={2.5}>
                  {profile.bio}
                </Typography>
              )}

              {/* Hourly rate */}
              {profile.hourlyRate && (
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1,
                  bgcolor: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 2, px: 1.75, py: 0.75, mb: 2,
                }}>
                  <Typography fontSize={16} fontWeight={900} color="#16a34a">${profile.hourlyRate}</Typography>
                  <Typography fontSize={12} color="#64748b">/soat</Typography>
                </Box>
              )}

              {/* Action buttons */}
              {!isOwnProfile && isLoggedIn && (
                <Stack spacing={1.5}>
                  <Button
                    variant={isFollowing ? 'outlined' : 'contained'}
                    startIcon={isFollowing ? <PersonRemoveIcon size={18} /> : <PersonAddIcon size={18} />}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    fullWidth
                    sx={isFollowing
                      ? { borderRadius: 2, color: '#64748b', borderColor: '#e2e8f0', fontWeight: 600 }
                      : { borderRadius: 2, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
                  >
                    {isFollowing ? 'Kuzatmayapman' : 'Kuzatish'}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<MessageIcon size={18} />}
                    fullWidth
                    onClick={handleMessageClick}
                    sx={{ borderRadius: 2, color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: 600 }}
                  >
                    Xabar yuborish
                  </Button>
                </Stack>
              )}

              {isOwnProfile && (
                <Button
                  variant="outlined" fullWidth
                  startIcon={<EditIcon size={18} />}
                  onClick={openEditDialog}
                  sx={{ borderRadius: 2, color: '#4f46e5', borderColor: '#c7d2fe', fontWeight: 600 }}
                >
                  Profilni tahrirlash
                </Button>
              )}
            </Box>
          </Box>

          {/* Stats card */}
          <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 2.5 }}>
            <Grid container spacing={0}>
              {[
                { label: 'Kuzatuvchilar', value: displayFollowerCount, icon: <FollowersIcon size={16} color="#4f46e5" />, color: '#4f46e5' },
                { label: 'Kuzatmoqda',   value: profile.followingCount ?? 0, icon: <PersonAddIcon size={16} color="#0891b2" />, color: '#0891b2' },
                { label: 'Bajarilgan',   value: profile.completedJobCount ?? 0, icon: <WorkIcon size={16} color="#16a34a" />, color: '#16a34a' },
                { label: 'Ko\'rishlar',  value: profile.profileViewCount ?? 0, icon: <EyeIcon size={16} color="#7c3aed" />, color: '#7c3aed' },
              ].map(({ label, value, icon, color }, idx) => (
                <Grid item xs={6} key={label}>
                  <Box sx={{
                    textAlign: 'center', p: 1.5,
                    borderRight: idx % 2 === 0 ? '1px solid #f1f5f9' : 'none',
                    borderBottom: idx < 2 ? '1px solid #f1f5f9' : 'none',
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>{icon}</Box>
                    <Typography fontWeight={900} fontSize={22} color={color} lineHeight={1}>{value}</Typography>
                    <Typography fontSize={11} color="#94a3b8" mt={0.25}>{label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Grid>

        {/* ════ O'NG: Tafsilotlar ════ */}
        <Grid item xs={12} md={8}>

          {/* Metrics bar */}
          <Box sx={{
            bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3,
            mb: 2.5, p: 2.5,
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 0,
          }}>
            {[
              {
                label: 'Reyting',
                value: <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center">
                  <StarIcon size={20} color="#f59e0b" weight="fill" />
                  <Typography fontWeight={900} fontSize={22} color="#0f172a">{profile.averageRating?.toFixed(1) ?? '5.0'}</Typography>
                </Stack>,
              },
              {
                label: 'Soatlik narx',
                value: <Typography fontWeight={900} fontSize={22} color="#4f46e5">
                  {profile.hourlyRate ? `$${profile.hourlyRate}` : '—'}
                </Typography>,
              },
              {
                label: 'Bajarilgan',
                value: <Typography fontWeight={900} fontSize={22} color="#16a34a">{profile.completedJobCount ?? 0}</Typography>,
              },
              {
                label: 'Holati',
                value: <Box sx={{
                  display: 'inline-block', px: 1.5, py: 0.4, borderRadius: 10,
                  bgcolor: isAvailable ? '#dcfce7' : '#fef9c3',
                  color: isAvailable ? '#16a34a' : '#ca8a04',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {isAvailable ? 'Bo\'sh' : 'Band'}
                </Box>,
              },
            ].map(({ label, value }, idx) => (
              <Box key={label} sx={{
                textAlign: 'center', py: 1.5, px: 1,
                borderRight: idx < 3 ? '1px solid #f1f5f9' : 'none',
              }}>
                {value}
                <Typography fontSize={11} color="#94a3b8" mt={0.5} textTransform="uppercase" letterSpacing={0.4}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Ko'nikmalar */}
          {profile.skills && profile.skills.length > 0 && (
            <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 3, mb: 2.5 }}>
              <Typography fontWeight={700} fontSize={15} color="#0f172a" mb={2}>Ko&apos;nikmalar</Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {profile.skills.map((skill, idx) => {
                  const c = SKILL_COLORS[idx % SKILL_COLORS.length];
                  return (
                    <Box key={skill} sx={{
                      px: 1.5, py: 0.5, borderRadius: 10,
                      bgcolor: c.bg, color: c.color,
                      fontSize: 12, fontWeight: 600,
                      border: `1px solid ${c.color}22`,
                    }}>
                      {skill}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Portfel */}
          {profile.portfolio && profile.portfolio.length > 0 && (
            <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 3, mb: 2.5 }}>
              <Typography fontWeight={700} fontSize={15} color="#0f172a" mb={2}>Portfel</Typography>
              <Grid container spacing={2}>
                {profile.portfolio.map((item, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Box sx={{
                      border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: '#c7d2fe', boxShadow: '0 4px 16px rgba(79,70,229,0.1)', transform: 'translateY(-2px)' },
                    }}>
                      {item.imageUrl ? (
                        <Box sx={{ height: 160, overflow: 'hidden', position: 'relative', bgcolor: '#f1f5f9' }}>
                          <img
                            src={item.imageUrl} alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ height: 120, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={36} color="#94a3b8" />
                        </Box>
                      )}
                      <Box sx={{ p: 2 }}>
                        <Typography fontWeight={700} fontSize={14} color="#0f172a" mb={0.25}>{item.title}</Typography>
                        {item.description && (
                          <Typography fontSize={12} color="#64748b" lineHeight={1.5}>{item.description}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Sharhlar */}
          {profile.reviews && profile.reviews.length > 0 && (
            <Box sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', borderRadius: 3, p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} mb={2.5}>
                <Typography fontWeight={700} fontSize={15} color="#0f172a">Sharhlar</Typography>
                <Box sx={{
                  bgcolor: '#eef2ff', color: '#4f46e5',
                  fontSize: 11, fontWeight: 800,
                  px: 1, py: 0.1, borderRadius: 10,
                }}>
                  {profile.reviews.length}
                </Box>
              </Stack>
              <Stack spacing={2.5}>
                {profile.reviews.map((review, idx) => (
                  <Box key={idx}>
                    {idx > 0 && <Divider sx={{ mb: 2.5 }} />}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ width: 36, height: 36, bgcolor: '#eef2ff', color: '#4f46e5', fontSize: 14, fontWeight: 700 }}>
                          {review.authorName?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={600} fontSize={13} color="#0f172a">{review.authorName}</Typography>
                          <Stack direction="row" spacing={0.25} mt={0.25}>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon key={i} size={12} color={i < review.rating ? '#f59e0b' : '#e2e8f0'} weight={i < review.rating ? 'fill' : 'regular'} />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    </Stack>
                    <Typography fontSize={13.5} color="#475569" lineHeight={1.7}>{review.reviewText}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ── Profilni tahrirlash dialogi ── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* Onboarding banner */}
        {isFreelancer && router.query.onboard === 'true' && (
          <Box sx={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', px: 3, py: 2 }}>
            <Typography fontWeight={800} fontSize={15} color="white">
              Xush kelibsiz, {currentUser.fullName ?? currentUser.username}!
            </Typography>
            <Typography fontSize={12} color="rgba(255,255,255,0.85)" mt={0.5}>
              Freelancer profilingizni to&apos;ldiring — mijozlar sizi osonroq topishadi
            </Typography>
          </Box>
        )}

        <DialogTitle sx={{ fontWeight: 800, pb: 1, fontSize: 16 }}>
          {router.query.onboard === 'true' ? "Freelancer Profilini To'ldiring" : 'Profilni tahrirlash'}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {saveError   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2 }}>{saveError}</Alert>}
          {saveSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{saveSuccess}</Alert>}

          <Stack spacing={3}>
            {/* Avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
              <input ref={portfolioFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortfolioFileChange} />

              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Avatar src={profileImage || undefined} sx={{ width: 80, height: 80, bgcolor: '#4f46e5', fontSize: 28 }}>
                  {(fullName || currentUser.username)?.[0]?.toUpperCase()}
                </Avatar>
                <IconButton
                  onClick={handleAvatarPick} disabled={avatarUploading}
                  sx={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, bgcolor: '#4f46e5', color: 'white', border: '2px solid white', '&:hover': { bgcolor: '#4338ca' }, '&:disabled': { bgcolor: '#94a3b8' } }}
                >
                  {avatarUploading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <PhotoCameraIcon size={14} />}
                </IconButton>
              </Box>

              <Box flex={1}>
                <Typography fontWeight={600} fontSize={14}>{fullName || currentUser.username}</Typography>
                <Typography fontSize={12} color="text.secondary" mb={0.75}>
                  {avatarUploading ? 'Yuklanmoqda...' : 'Rasm o\'zgartirish uchun bosing'}
                </Typography>
                <Button size="small" variant="outlined" startIcon={<PhotoCameraIcon size={18} />}
                  onClick={handleAvatarPick} disabled={avatarUploading}
                  sx={{ fontSize: 11, borderColor: '#e2e8f0', color: '#4f46e5', py: 0.5, borderRadius: 1.5 }}>
                  Rasm tanlash
                </Button>
              </Box>
            </Box>

            <Divider />

            {/* Asosiy ma'lumotlar */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="To'liq ism" placeholder="Otabek Ikromov"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth size="small" label="Joylashuv" placeholder="Toshkent, UZ"
                  value={location} onChange={(e) => setLocation(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={3} label="Bio"
                  placeholder="O'zingiz haqida yozing..."
                  value={bio} onChange={(e) => setBio(e.target.value)}
                  inputProps={{ maxLength: 500 }}
                  helperText={`${bio.length}/500`}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
            </Grid>

            {/* Frilanser sozlamalari */}
            {isFreelancer && (
              <>
                <Divider><Typography fontSize={12} color="text.secondary">Frilanser sozlamalari</Typography></Divider>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Mutaxassislik</InputLabel>
                      <Select value={freelancerCategory} label="Mutaxassislik"
                        onChange={(e) => setFreelancerCategory(e.target.value)}
                        sx={{ borderRadius: 2 }}>
                        <MenuItem value="">— Tanlanmagan —</MenuItem>
                        {Object.values(JobCategory).map((cat) => (
                          <MenuItem key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="Soatlik narx ($)"
                      type="number" inputProps={{ min: 0, step: 1 }}
                      value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography fontSize={13} fontWeight={600} color="text.secondary" mb={1}>Bandlik holati</Typography>
                    <ToggleButtonGroup value={availability} exclusive size="small"
                      onChange={(_, v) => v && setAvailability(v)}>
                      <ToggleButton value={FreelancerAvailability.AVAILABLE}
                        sx={{ fontSize: 12, textTransform: 'none', px: 2.5, borderRadius: '8px !important', gap: 0.75,
                          '&.Mui-selected': { bgcolor: '#dcfce7', color: '#16a34a', borderColor: '#86efac' } }}>
                        <CheckCircle size={14} /> Bo&apos;sh
                      </ToggleButton>
                      <ToggleButton value={FreelancerAvailability.BUSY}
                        sx={{ fontSize: 12, textTransform: 'none', px: 2.5, borderRadius: '8px !important', gap: 0.75,
                          '&.Mui-selected': { bgcolor: '#fef3c7', color: '#d97706', borderColor: '#fcd34d' } }}>
                        <Timer size={14} /> Band
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Grid>
                </Grid>

                {/* Ko'nikmalar */}
                <Box>
                  <Typography fontSize={13} fontWeight={600} color="text.secondary" mb={1}>Ko&apos;nikmalar</Typography>
                  <Stack direction="row" spacing={1} mb={1.5}>
                    <TextField size="small" placeholder="Masalan: AutoCAD, 3D Max"
                      value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                    <Button variant="outlined" onClick={addSkill} size="small"
                      sx={{ borderColor: '#e2e8f0', color: '#4f46e5', borderRadius: 2, minWidth: 40 }}>
                      <AddIcon size={20} />
                    </Button>
                  </Stack>
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {skills.map((s) => (
                      <Chip key={s} label={s} size="small"
                        onDelete={() => setSkills(prev => prev.filter(x => x !== s))}
                        sx={{ fontSize: 11, bgcolor: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }} />
                    ))}
                    {skills.length === 0 && (
                      <Typography fontSize={12} color="text.secondary">Ko&apos;nikma qo&apos;shilmagan</Typography>
                    )}
                  </Stack>
                </Box>

                {/* Portfel */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={13} fontWeight={600} color="text.secondary">Portfel</Typography>
                    <Button size="small" variant="outlined" startIcon={<AddIcon size={18} />}
                      onClick={addPortfolioItem}
                      sx={{ fontSize: 11, borderColor: '#e2e8f0', color: '#4f46e5', py: 0.25, borderRadius: 1.5 }}>
                      Qo&apos;shish
                    </Button>
                  </Stack>

                  {portfolio.length === 0 ? (
                    <Box
                      sx={{ py: 3, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 2, cursor: 'pointer', '&:hover': { borderColor: '#c7d2fe', bgcolor: '#fafafe' } }}
                      onClick={addPortfolioItem}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                        <ImageIcon size={30} color="#94a3b8" />
                      </Box>
                      <Typography fontSize={13} color="text.secondary">Portfel yo&apos;q. Qo&apos;shish uchun bosing.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {portfolio.map((item, idx) => (
                        <Box key={idx} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                            <Typography fontSize={12} fontWeight={600} color="#64748b">#{idx + 1} element</Typography>
                            <IconButton size="small" onClick={() => removePortfolioItem(idx)}
                              sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' } }}>
                              <DeleteIcon size={18} />
                            </IconButton>
                          </Stack>
                          {/* Image picker */}
                          <Box
                            sx={{
                              width: '100%', height: 110, borderRadius: 2, mb: 1.5,
                              border: '2px dashed #e2e8f0', overflow: 'hidden',
                              position: 'relative', cursor: 'pointer', bgcolor: '#f8fafc',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              '&:hover': { borderColor: '#c7d2fe', bgcolor: '#fafafe' },
                            }}
                            onClick={() => handlePortfolioImagePick(idx)}
                          >
                            {portfolioUploadingIdx === idx ? (
                              <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
                            ) : item.imageUrl ? (
                              <>
                                <Box component="img" src={item.imageUrl} alt=""
                                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e: any) => { e.target.style.display = 'none'; }} />
                                <Box sx={{
                                  position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.35)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  opacity: 0, transition: 'opacity 0.2s', '&:hover': { opacity: 1 },
                                }}>
                                  <PhotoCameraIcon size={28} color="#fff" />
                                </Box>
                              </>
                            ) : (
                              <Stack alignItems="center" spacing={0.5}>
                                <PhotoCameraIcon size={28} color="#94a3b8" />
                                <Typography fontSize={11} color="text.secondary">Rasm tanlash</Typography>
                              </Stack>
                            )}
                          </Box>
                          <Grid container spacing={1}>
                            <Grid item xs={12}>
                              <TextField fullWidth size="small" label="Sarlavha"
                                value={item.title}
                                onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField fullWidth size="small" label="Tavsif"
                                value={item.description}
                                onChange={(e) => updatePortfolioItem(idx, 'description', e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
                            </Grid>
                          </Grid>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#64748b', borderRadius: 2 }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || avatarUploading || portfolioUploadingIdx !== null}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <SaveIcon size={18} />}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, px: 3, borderRadius: 2, fontWeight: 700 }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default withLayoutBasic(ProfilePage);
