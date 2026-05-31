import React, { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Alert,
  Avatar,
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
  Button,
  Chip,
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
  Copy as CopyIcon,
  Lightning as BoltIcon,
  Envelope as MailIcon,
  MapPin,
  Translate,
  CalendarBlank,
} from '@phosphor-icons/react';
import { GET_USER_BY_ID, GET_MY_PROFILE, CHECK_IS_FOLLOWING } from '../../apollo/user/query';
import { TOGGLE_FOLLOW, UPDATE_PROFILE } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { User, PortfolioItem as PortfolioItemType } from '../../libs/types';
import { FreelancerAvailability, JOB_CATEGORY_LABELS, JobCategory, UserType } from '../../libs/enums';

type TabKey = 'umumiy' | 'portfolio' | 'sharhlar' | 'konikmalar';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'umumiy', label: 'Umumiy' },
  { key: 'portfolio', label: 'Portfolio' },
  { key: 'sharhlar', label: 'Sharhlar' },
  { key: 'konikmalar', label: "Ko'nikmalar" },
];

interface PortfolioItem {
  title: string;
  imageUrl: string;
  description: string;
}

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={i < Math.round(rating) ? '#f59e0b' : '#e2e8f0'}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ))}
  </div>
);

const ProfilePage = () => {
  const router = useRouter();
  const userId = router.query.id as string;
  const currentUser = useReactiveVar(userVar);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('umumiy');
  const [copied, setCopied] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  const isLoggedIn = mounted && !!currentUser._id;
  const isOwnProfile = mounted && currentUser._id === userId;
  const isFreelancer = isOwnProfile && currentUser.userType === UserType.FREELANCER;

  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState<number | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const [portfolioUploadingIdx, setPortfolioUploadingIdx] = useState<number | null>(null);

  // Edit form fields
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [availability, setAvailability] = useState<FreelancerAvailability>(FreelancerAvailability.AVAILABLE);
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);

  // Queries
  const { data, loading, refetch } = useQuery(GET_USER_BY_ID, { variables: { userId }, skip: !userId });
  const { data: myProfileData } = useQuery(GET_MY_PROFILE, { skip: !isOwnProfile, fetchPolicy: 'network-only' });
  const { data: followCheckData } = useQuery(CHECK_IS_FOLLOWING, {
    variables: { targetUserId: userId },
    skip: !isLoggedIn || !userId || isOwnProfile,
    fetchPolicy: 'network-only',
  });

  const [toggleFollow] = useMutation(TOGGLE_FOLLOW);
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
      else setSaveError("Rasm yuklashda xatolik. Qayta urinib ko'ring.");
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
      else setSaveError("Portfel rasmi yuklanmadi. Qayta urinib ko'ring.");
    } catch { setSaveError('Portfel rasmi yuklanmadi.'); }
    finally { setPortfolioUploadingIdx(null); if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = ''; }
  };

  const handleSave = async () => {
    setSaveError(''); setSaveSuccess(''); setSaving(true);
    const input: any = {};
    if (fullName.trim()) input.fullName = fullName.trim();
    if (bio.trim() !== undefined) input.bio = bio.trim();
    if (location.trim()) input.location = location.trim();
    if (profileImage) input.profileImage = profileImage;
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
      setSaveError(err?.graphQLErrors?.[0]?.message ?? "Saqlashda xatolik. Qayta urinib ko'ring.");
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
    window.dispatchEvent(new CustomEvent('openChat', {
      detail: {
        userId: profile._id,
        userName: profile.fullName ?? profile.username,
        avatar: profile.profileImage,
      },
    }));
  };

  const handleCopyProfile = () => {
    if (!profile) return;
    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile._id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading
  if (loading || !userId) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Profil yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-32">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
            <UserIcon size={40} color="#94a3b8" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Foydalanuvchi topilmadi</h2>
        <p className="text-sm text-slate-500 mb-6">Bu profil o&apos;chirilgan yoki mavjud emas</p>
        <Link href="/browse">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer">
            Frilanserlarni ko&apos;rish
          </span>
        </Link>
      </div>
    );
  }

  const categoryLabel = profile.freelancerCategory ? JOB_CATEGORY_LABELS[profile.freelancerCategory as JobCategory] : null;
  const isAvailable = profile.availability === FreelancerAvailability.AVAILABLE;
  const displayFollowerCount = localFollowerCount ?? profile.followerCount ?? 0;
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' })
    : null;

  return (
    <>
      <Head>
        <title>{profile.fullName ?? profile.username} — BuFu</title>
      </Head>

      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeftIcon size={16} />
          Orqaga
        </button>
      </div>

      {/* ── Cover Banner ── */}
      <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden mb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-indigo-600 to-violet-600" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c4b5fd 0%, transparent 40%)' }}
        />
        {isOwnProfile && (
          <button
            onClick={openEditDialog}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20"
          >
            <EditIcon size={16} />
          </button>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-12 gap-6 -mt-16 relative z-10 pb-16">

        {/* ════ LEFT: Profile Details ════ */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* ── Profile Header Card ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-5 items-start">

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-28 h-28 rounded-xl overflow-hidden border-4 border-white shadow-lg cursor-pointer"
                  onClick={isOwnProfile ? openEditDialog : undefined}
                >
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt={profile.fullName ?? profile.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                      {(profile.fullName ?? profile.username)?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div
                  className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-[3px] border-white shadow-sm ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-amber-400'}`}
                />
              </div>

              {/* Info */}
              <div className="flex-grow min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
                    {profile.fullName ?? profile.username}
                  </h1>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#4f46e5">
                    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  {categoryLabel && (
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                      {categoryLabel}
                    </span>
                  )}
                </div>

                <p className="text-slate-500 text-sm mb-1">@{profile.username}</p>

                {/* Availability badge */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-amber-400'}`} />
                  {isAvailable ? "Yangi loyiha uchun bo'sh" : 'Band'}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-100">
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-xl font-extrabold text-slate-900">
                        {profile.averageRating?.toFixed(1) ?? '5.0'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Reyting</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-slate-900 mb-0.5">{profile.completedJobCount ?? 0}</p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bajarilgan</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-indigo-600 mb-0.5">
                      {profile.hourlyRate ? `$${profile.hourlyRate}` : '—'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Soatlik</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Men haqimda</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Tab nav */}
            <div className="flex border-b border-slate-100">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
                    activeTab === tab.key
                      ? 'text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">

              {/* ── Umumiy tab ── */}
              {activeTab === 'umumiy' && (
                <div className="space-y-6">
                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Kuzatuvchilar', value: displayFollowerCount, color: 'text-indigo-600' },
                      { label: 'Kuzatmoqda', value: profile.followingCount ?? 0, color: 'text-cyan-600' },
                      { label: "Ko'rishlar", value: profile.profileViewCount ?? 0, color: 'text-violet-600' },
                      { label: 'Bajarilgan', value: profile.completedJobCount ?? 0, color: 'text-emerald-600' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-3.5 text-center border border-slate-100">
                        <p className={`text-2xl font-black ${color} leading-none mb-1`}>{value}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bio if not shown above */}
                  {!profile.bio && (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      Bio mavjud emas
                    </div>
                  )}

                  {/* Skills preview */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3">Asosiy ko&apos;nikmalar</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100"
                          >
                            {skill}
                          </span>
                        ))}
                        {profile.skills.length > 6 && (
                          <button
                            onClick={() => setActiveTab('konikmalar')}
                            className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            +{profile.skills.length - 6} ko&apos;proq
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Portfolio tab ── */}
              {activeTab === 'portfolio' && (
                <div>
                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.portfolio.map((item, idx) => (
                        <div
                          key={idx}
                          className="group border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
                        >
                          {item.imageUrl ? (
                            <div className="h-44 overflow-hidden bg-slate-100">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="h-32 bg-slate-100 flex items-center justify-center">
                              <ImageIcon size={36} color="#94a3b8" />
                            </div>
                          )}
                          <div className="p-4">
                            <h4 className="text-sm font-bold text-slate-800 mb-1">{item.title}</h4>
                            {item.description && (
                              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon size={40} color="#cbd5e1" />
                      <p className="mt-3 text-sm text-slate-400">Portfolio bo&apos;sh</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Sharhlar tab ── */}
              {activeTab === 'sharhlar' && (
                <div>
                  {profile.reviews && profile.reviews.length > 0 ? (
                    <div className="space-y-1">
                      {/* Rating summary */}
                      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl mb-5 border border-slate-100">
                        <div className="text-center">
                          <p className="text-4xl font-black text-slate-900">{profile.averageRating?.toFixed(1) ?? '5.0'}</p>
                          <StarRating rating={profile.averageRating ?? 5} size={14} />
                          <p className="text-xs text-slate-400 mt-1">{profile.reviews.length} sharh</p>
                        </div>
                        <div className="flex-grow space-y-1.5">
                          {[5, 4, 3, 2, 1].map((star) => {
                            const count = (profile.reviews ?? []).filter(r => Math.round(r.rating) === star).length;
                            const pct = profile.reviews!.length > 0 ? (count / profile.reviews!.length) * 100 : 0;
                            return (
                              <div key={star} className="flex items-center gap-2">
                                <span className="text-xs text-slate-500 w-3 text-right">{star}</span>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                                <div className="flex-grow bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className="bg-amber-400 h-1.5 rounded-full transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 w-4">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review list */}
                      <div className="space-y-5">
                        {profile.reviews.map((review, idx) => (
                          <div key={idx}>
                            {idx > 0 && <div className="border-t border-slate-100 mb-5" />}
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm flex items-center justify-center flex-shrink-0">
                                {review.authorName?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex-grow">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-sm font-semibold text-slate-800">{review.authorName}</p>
                                  <StarRating rating={review.rating} size={13} />
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed italic">&ldquo;{review.reviewText}&rdquo;</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <StarIcon size={40} color="#cbd5e1" />
                      <p className="mt-3 text-sm text-slate-400">Sharhlar yo&apos;q</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Ko'nikmalar tab ── */}
              {activeTab === 'konikmalar' && (
                <div>
                  {profile.skills && profile.skills.length > 0 ? (
                    <>
                      <h4 className="text-sm font-semibold text-slate-700 mb-4">Barcha ko&apos;nikmalar</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {profile.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-slate-400">Ko&apos;nikmalar qo&apos;shilmagan</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ════ RIGHT: Sticky Action Card ════ */}
        <div className="col-span-12 lg:col-span-4">
          <div className="sticky top-6 space-y-4">

            {/* Action card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              {/* Availability */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Xizmat mavjudligi</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-amber-400'}`} />
                  <span className={`text-sm font-semibold ${isAvailable ? 'text-green-600' : 'text-amber-600'}`}>
                    {isAvailable ? "Yangi loyiha uchun bo'sh" : 'Hozir band'}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              {!isOwnProfile && isLoggedIn ? (
                <div className="space-y-3">
                  <button
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 ${
                      isFollowing
                        ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                    }`}
                  >
                    {isFollowing ? <PersonRemoveIcon size={18} /> : <PersonAddIcon size={18} />}
                    {isFollowing ? 'Kuzatmayapman' : 'Ish taklif qilish'}
                  </button>
                  <button
                    onClick={handleMessageClick}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-600 flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all duration-200 active:scale-95"
                  >
                    <MailIcon size={18} />
                    Xabar yuborish
                  </button>
                </div>
              ) : isOwnProfile ? (
                <button
                  onClick={openEditDialog}
                  className="w-full py-3.5 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-600 flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all duration-200"
                >
                  <EditIcon size={18} />
                  Profilni tahrirlash
                </button>
              ) : (
                <Link href="/login">
                  <button className="w-full py-3.5 rounded-xl text-sm font-bold bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                    <BoltIcon size={18} />
                    Ish taklif qilish
                  </button>
                </Link>
              )}

              {/* Meta info */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Javob vaqti</span>
                  <span className="text-sm font-semibold text-slate-800">~2 soat</span>
                </div>
                {profile.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Joylashuv</span>
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      {profile.location}
                    </span>
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">A&apos;zo bo&apos;lgan</span>
                    <span className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <CalendarBlank size={13} className="text-slate-400" />
                      {memberSince}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Share card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Profilni ulashish</p>
                <p className="text-sm font-semibold text-slate-700 truncate">
                  bufu.uz/{profile.username}
                </p>
              </div>
              <button
                onClick={handleCopyProfile}
                className="ml-3 flex-shrink-0 p-2.5 bg-white border border-slate-200 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Nusxa olish"
              >
                <CopyIcon size={18} />
              </button>
            </div>
            {copied && (
              <p className="text-xs text-center text-green-600 font-medium -mt-2">Nusxa olindi!</p>
            )}

          </div>
        </div>
      </div>

      {/* ── Edit Profile Dialog ── */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {isFreelancer && router.query.onboard === 'true' && (
          <div className="bg-gradient-to-r from-indigo-700 to-violet-600 px-6 py-4">
            <p className="text-white font-extrabold text-base">
              Xush kelibsiz, {currentUser.fullName ?? currentUser.username}!
            </p>
            <p className="text-white/80 text-xs mt-0.5">
              Freelancer profilingizni to&apos;ldiring — mijozlar sizi osonroq topishadi
            </p>
          </div>
        )}

        <DialogTitle sx={{ fontWeight: 800, pb: 1, fontSize: 16 }}>
          {router.query.onboard === 'true' ? "Freelancer Profilini To'ldiring" : 'Profilni tahrirlash'}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {saveError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{saveError}</Alert>}
          {saveSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{saveSuccess}</Alert>}

          <Stack spacing={3}>
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
              <input ref={portfolioFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePortfolioFileChange} />

              <div className="relative flex-shrink-0">
                <Avatar src={profileImage || undefined} sx={{ width: 80, height: 80, bgcolor: '#4f46e5', fontSize: 28 }}>
                  {(fullName || currentUser.username)?.[0]?.toUpperCase()}
                </Avatar>
                <IconButton
                  onClick={handleAvatarPick} disabled={avatarUploading}
                  sx={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, bgcolor: '#4f46e5', color: 'white', border: '2px solid white', '&:hover': { bgcolor: '#4338ca' }, '&:disabled': { bgcolor: '#94a3b8' } }}
                >
                  {avatarUploading ? <CircularProgress size={14} sx={{ color: 'white' }} /> : <PhotoCameraIcon size={14} />}
                </IconButton>
              </div>

              <div className="flex-1">
                <Typography fontWeight={600} fontSize={14}>{fullName || currentUser.username}</Typography>
                <Typography fontSize={12} color="text.secondary" mb={0.75}>
                  {avatarUploading ? 'Yuklanmoqda...' : "Rasm o'zgartirish uchun bosing"}
                </Typography>
                <Button size="small" variant="outlined" startIcon={<PhotoCameraIcon size={18} />}
                  onClick={handleAvatarPick} disabled={avatarUploading}
                  sx={{ fontSize: 11, borderColor: '#e2e8f0', color: '#4f46e5', py: 0.5, borderRadius: 1.5 }}>
                  Rasm tanlash
                </Button>
              </div>
            </div>

            <Divider />

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
                <div>
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
                </div>

                {/* Portfel */}
                <div>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography fontSize={13} fontWeight={600} color="text.secondary">Portfel</Typography>
                    <Button size="small" variant="outlined" startIcon={<AddIcon size={18} />}
                      onClick={addPortfolioItem}
                      sx={{ fontSize: 11, borderColor: '#e2e8f0', color: '#4f46e5', py: 0.25, borderRadius: 1.5 }}>
                      Qo&apos;shish
                    </Button>
                  </Stack>

                  {portfolio.length === 0 ? (
                    <div
                      className="py-8 text-center border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-slate-50 transition-colors"
                      onClick={addPortfolioItem}
                    >
                      <ImageIcon size={30} color="#94a3b8" style={{ margin: '0 auto 6px' }} />
                      <p className="text-sm text-slate-400">Portfel yo&apos;q. Qo&apos;shish uchun bosing.</p>
                    </div>
                  ) : (
                    <Stack spacing={2}>
                      {portfolio.map((item, idx) => (
                        <div key={idx} className="p-4 border border-slate-200 rounded-xl">
                          <div className="flex justify-between items-center mb-3">
                            <Typography fontSize={12} fontWeight={600} color="#64748b">#{idx + 1} element</Typography>
                            <IconButton size="small" onClick={() => removePortfolioItem(idx)}
                              sx={{ color: '#dc2626', '&:hover': { bgcolor: '#fef2f2' } }}>
                              <DeleteIcon size={18} />
                            </IconButton>
                          </div>
                          <div
                            className="w-full h-28 rounded-xl mb-3 border-2 border-dashed border-slate-200 overflow-hidden relative cursor-pointer bg-slate-50 flex items-center justify-center hover:border-indigo-300 hover:bg-slate-100 transition-colors"
                            onClick={() => handlePortfolioImagePick(idx)}
                          >
                            {portfolioUploadingIdx === idx ? (
                              <CircularProgress size={28} sx={{ color: '#4f46e5' }} />
                            ) : item.imageUrl ? (
                              <>
                                <img src={item.imageUrl} alt="" className="w-full h-full object-cover absolute inset-0" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <PhotoCameraIcon size={28} color="#fff" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center gap-1">
                                <PhotoCameraIcon size={28} color="#94a3b8" />
                                <span className="text-xs text-slate-400">Rasm tanlash</span>
                              </div>
                            )}
                          </div>
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
                        </div>
                      ))}
                    </Stack>
                  )}
                </div>
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
