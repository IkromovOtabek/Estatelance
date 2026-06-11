import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useMutation, useQuery } from '@apollo/client';
import { useReactiveVar } from '@apollo/client';
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
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
import MapModal, { getYandexSuggests } from '../../libs/components/common/YandexMapModal';
import MiniMap from '../../libs/components/common/MiniMap';
import BoostModal from '../../libs/components/common/BoostModal';
import BoostProfileStats from '../../libs/components/common/BoostProfileStats';
import { TOGGLE_FOLLOW, UPDATE_PROFILE, SUBMIT_PROFILE_BOOST_PAYMENT } from '../../apollo/user/mutation';
import { isJobBoostActive } from '../../libs/utils/boost';
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
  const { resolvedTheme } = useTheme();

  useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';
  const isLoggedIn = mounted && !!currentUser._id;
  const isOwnProfile = mounted && currentUser._id === userId;
  const isFreelancer = isOwnProfile && currentUser.userType === UserType.FREELANCER;
  const canProfileBoost =
    isOwnProfile &&
    (currentUser.userType === UserType.FREELANCER || currentUser.userType === UserType.AGENT);
  const [profileBoostOpen, setProfileBoostOpen] = useState(false);

  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localFollowerCount, setLocalFollowerCount] = useState<number | null>(null);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editMapOpen, setEditMapOpen] = useState(false);
  const [locationSuggests, setLocationSuggests] = useState<string[]>([]);
  const locationTimer = useRef<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const [portfolioUploadingIdx, setPortfolioUploadingIdx] = useState<number | null>(null);

  // Inline portfolio add (tab ichida)
  const inlinePortfolioFileRef = useRef<HTMLInputElement>(null);
  const [inlinePortfolioUrl, setInlinePortfolioUrl] = useState('');
  const [inlinePortfolioTitle, setInlinePortfolioTitle] = useState('');
  const [inlinePortfolioDesc, setInlinePortfolioDesc] = useState('');
  const [inlinePortfolioUploading, setInlinePortfolioUploading] = useState(false);
  const [inlinePortfolioError, setInlinePortfolioError] = useState('');
  const [inlinePortfolioSaving, setInlinePortfolioSaving] = useState(false);
  const [showInlineForm, setShowInlineForm] = useState(false);

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
  const { data: myProfileData, refetch: refetchMyProfile } = useQuery(GET_MY_PROFILE, {
    skip: !isOwnProfile,
    fetchPolicy: 'network-only',
  });
  const { data: followCheckData } = useQuery(CHECK_IS_FOLLOWING, {
    variables: { targetUserId: userId },
    skip: !isLoggedIn || !userId || isOwnProfile,
    fetchPolicy: 'network-only',
  });

  const [toggleFollow] = useMutation(TOGGLE_FOLLOW);
  const [updateProfile] = useMutation(UPDATE_PROFILE);
  const [submitProfileBoostPayment] = useMutation(SUBMIT_PROFILE_BOOST_PAYMENT);

  const profile: User | null = data?.getUserById ?? null;
  const ownProfile: User | null = myProfileData?.getMyProfile ?? profile;

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
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const uploadData = isPdf ? base64 : await compressImage(base64, 800, 0.82);
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: uploadData, fileName: file.name }) });
      const json = await res.json();
      if (json.url) updatePortfolioItem(idx, 'imageUrl', json.url);
      else setSaveError("Portfel fayli yuklanmadi. Qayta urinib ko'ring.");
    } catch { setSaveError('Portfel fayli yuklanmadi.'); }
    finally { setPortfolioUploadingIdx(null); if (portfolioFileInputRef.current) portfolioFileInputRef.current.value = ''; }
  };

  // Inline portfolio handlers
  const handleInlinePortfolioFilePick = () => {
    setInlinePortfolioError('');
    inlinePortfolioFileRef.current?.click();
  };

  const handleInlinePortfolioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlinePortfolioUploading(true);
    setInlinePortfolioError('');
    try {
      const base64 = await readFile(file);
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const uploadData = isPdf ? base64 : await compressImage(base64, 800, 0.82);
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: uploadData, fileName: file.name }) });
      const json = await res.json();
      if (json.url) {
        setInlinePortfolioUrl(json.url);
        setShowInlineForm(true);
        if (!inlinePortfolioTitle) setInlinePortfolioTitle(file.name.replace(/\.[^.]+$/, ''));
      } else {
        setInlinePortfolioError("Fayl yuklanmadi. Qayta urinib ko'ring.");
      }
    } catch {
      setInlinePortfolioError('Fayl yuklanmadi.');
    } finally {
      setInlinePortfolioUploading(false);
      if (inlinePortfolioFileRef.current) inlinePortfolioFileRef.current.value = '';
    }
  };

  const handleInlinePortfolioSave = async () => {
    if (!inlinePortfolioTitle.trim() || !inlinePortfolioUrl) return;
    setInlinePortfolioSaving(true);
    setInlinePortfolioError('');
    try {
      const existingPortfolio = (profile?.portfolio ?? []).map((item: any) => ({
        title: item.title ?? '',
        imageUrl: item.imageUrl ?? '',
        description: item.description ?? '',
      }));
      const newItem = { title: inlinePortfolioTitle.trim(), imageUrl: inlinePortfolioUrl, description: inlinePortfolioDesc.trim() };
      await updateProfile({ variables: { input: { portfolio: [...existingPortfolio, newItem] } } });
      setInlinePortfolioUrl('');
      setInlinePortfolioTitle('');
      setInlinePortfolioDesc('');
      setShowInlineForm(false);
      refetch();
    } catch {
      setInlinePortfolioError("Saqlashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setInlinePortfolioSaving(false);
    }
  };

  const handleInlinePortfolioCancel = () => {
    setShowInlineForm(false);
    setInlinePortfolioUrl('');
    setInlinePortfolioTitle('');
    setInlinePortfolioDesc('');
    setInlinePortfolioError('');
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
    if (!profile) return;
    if (!isLoggedIn) { window.dispatchEvent(new CustomEvent('bufu-auth-required')); return; }
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
    const skBg  = isDark ? '#16161F' : '#f1f5f9';
    const skCard = isDark ? '#0f172a' : '#ffffff';
    const skBorder = isDark ? '#16161F' : '#e2e8f0';
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        {/* Header skeleton */}
        <div className="rounded-3xl p-8 mb-6" style={{ backgroundColor: skCard, border: `1px solid ${skBorder}` }}>
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full flex-shrink-0" style={{ backgroundColor: skBg }} />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-6 w-48 rounded-lg" style={{ backgroundColor: skBg }} />
              <div className="h-4 w-32 rounded-lg" style={{ backgroundColor: skBg }} />
              <div className="h-4 w-64 rounded-lg" style={{ backgroundColor: skBg }} />
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-24 rounded-xl" style={{ backgroundColor: skBg }} />
                <div className="h-8 w-24 rounded-xl" style={{ backgroundColor: skBg }} />
              </div>
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl p-5" style={{ backgroundColor: skCard, border: `1px solid ${skBorder}` }}>
              <div className="h-7 w-12 rounded-lg mb-2" style={{ backgroundColor: skBg }} />
              <div className="h-4 w-20 rounded-lg" style={{ backgroundColor: skBg }} />
            </div>
          ))}
        </div>
        {/* Portfolio skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-video rounded-2xl" style={{ backgroundColor: skBg }} />
          ))}
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
        <title>{profile.fullName ?? profile.username} — BuFu Frilanser</title>
        <meta name="description" content={profile.bio?.slice(0, 155) ?? `${profile.fullName ?? profile.username} — BuFu platformasidagi mutaxassis frilanser.`} />
        <meta property="og:title" content={`${profile.fullName ?? profile.username} — BuFu`} />
        <meta property="og:description" content={profile.bio?.slice(0, 155) ?? ''} />
        {profile.profileImage && <meta property="og:image" content={profile.profileImage} />}
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
      <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden mb-0">

        {isDark ? (
          <>
            {/* DARK: Base mesh gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a0533 0%, #0d1b4b 30%, #0a2a4a 55%, #130826 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at -5% 50%, #7c3aed99 0%, transparent 55%), radial-gradient(ellipse 60% 70% at 105% 40%, #0891b299 0%, transparent 55%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 60% at 50% -10%, #db277760 0%, transparent 50%), radial-gradient(ellipse 40% 50% at 50% 110%, #4f46e560 0%, transparent 50%)' }} />
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="dotgrid-d" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.8" fill="white" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#dotgrid-d)" />
            </svg>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ds1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0"/><stop offset="40%" stopColor="#a78bfa" stopOpacity="0.5"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/></linearGradient>
                <linearGradient id="ds2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f472b6" stopOpacity="0"/><stop offset="50%" stopColor="#f472b6" stopOpacity="0.35"/><stop offset="100%" stopColor="#a78bfa" stopOpacity="0"/></linearGradient>
                <linearGradient id="ds3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#34d399" stopOpacity="0"/><stop offset="55%" stopColor="#34d399" stopOpacity="0.25"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/></linearGradient>
              </defs>
              <line x1="-50" y1="60" x2="950" y2="90" stroke="url(#ds1)" strokeWidth="1.2"/>
              <line x1="-50" y1="130" x2="950" y2="155" stroke="url(#ds2)" strokeWidth="0.8"/>
              <line x1="-50" y1="200" x2="950" y2="220" stroke="url(#ds3)" strokeWidth="0.9"/>
              {[120,280,450,620,800].map((x, i) => <circle key={i} cx={x} cy={60+(x/900)*30} r="2" fill="#a78bfa" opacity="0.7"/>)}
              {[60,220,400,580,760].map((x, i) => <circle key={i} cx={x} cy={130+(x/900)*25} r="1.5" fill="#f472b6" opacity="0.6"/>)}
            </svg>
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              {[{cx:70,cy:50,r:28,clr:'#a78bfa'},{cx:830,cy:80,r:22,clr:'#38bdf8'},{cx:180,cy:200,r:18,clr:'#f472b6'},{cx:700,cy:190,r:24,clr:'#34d399'},{cx:450,cy:30,r:16,clr:'#818cf8'}].map((h,i)=>(
                <polygon key={i} points={[0,1,2,3,4,5].map(k=>{const a=(Math.PI/3)*k-Math.PI/6;return`${h.cx+h.r*Math.cos(a)},${h.cy+h.r*Math.sin(a)}`;}).join(' ')} fill="none" stroke={h.clr} strokeWidth="1.2"/>
              ))}
            </svg>
            {/* Dark: left role badge */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none select-none hidden sm:flex">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(167,139,250,0.4)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-violet-200 text-xs font-semibold tracking-wide uppercase">{profile?.userType === UserType.FREELANCER ? 'Freelancer' : profile?.userType === 'AGENT' ? 'Agent' : 'Mijoz'}</span>
              </div>
            </div>
            {/* Dark: right chips */}
            <div className="absolute right-5 top-5 pointer-events-none select-none hidden sm:flex flex-col gap-2">
              {[{dot:'#34d399',label:'Verified',glow:'#34d39950'},{dot:'#fbbf24',label:'Top Rated',glow:'#fbbf2440'},{dot:'#818cf8',label:'Fast Reply',glow:'#818cf850'}].map(b=>(
                <div key={b.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{ background: 'rgba(15,23,42,0.45)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.dot, boxShadow: `0 0 6px 2px ${b.glow}` }} />
                  <span className="text-white/80 text-xs font-medium">{b.label}</span>
                </div>
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent 0%, #a78bfa 20%, #38bdf8 50%, #f472b6 80%, transparent 100%)', opacity: 0.7 }} />
          </>
        ) : (
          <>
            {/* LIGHT: Base gradient */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 35%, #ddd6fe 65%, #fae8ff 100%)' }} />
            {/* Light orbs */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 65% 80% at -5% 50%, #c7d2fe90 0%, transparent 55%), radial-gradient(ellipse 55% 70% at 105% 40%, #bae6fd80 0%, transparent 55%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 55% at 50% -15%, #e9d5ff70 0%, transparent 50%), radial-gradient(ellipse 45% 55% at 75% 105%, #a5f3fc50 0%, transparent 50%)' }} />
            {/* Light dot grid */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="dotgrid-l" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.7" fill="#6366f1" /></pattern></defs>
              <rect width="100%" height="100%" fill="url(#dotgrid-l)" />
            </svg>
            {/* Light streaks */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ls1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" stopOpacity="0"/><stop offset="40%" stopColor="#6366f1" stopOpacity="0.25"/><stop offset="100%" stopColor="#06b6d4" stopOpacity="0"/></linearGradient>
                <linearGradient id="ls2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#818CF8" stopOpacity="0"/><stop offset="50%" stopColor="#818CF8" stopOpacity="0.2"/><stop offset="100%" stopColor="#6366f1" stopOpacity="0"/></linearGradient>
                <linearGradient id="ls3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#0891b2" stopOpacity="0"/><stop offset="55%" stopColor="#0891b2" stopOpacity="0.18"/><stop offset="100%" stopColor="#7c3aed" stopOpacity="0"/></linearGradient>
              </defs>
              <line x1="-50" y1="55" x2="950" y2="85" stroke="url(#ls1)" strokeWidth="1.5"/>
              <line x1="-50" y1="130" x2="950" y2="150" stroke="url(#ls2)" strokeWidth="1"/>
              <line x1="-50" y1="195" x2="950" y2="215" stroke="url(#ls3)" strokeWidth="1.2"/>
              {[100,250,430,600,780].map((x,i)=><circle key={i} cx={x} cy={55+(x/900)*30} r="2.5" fill="#6366f1" opacity="0.4"/>)}
              {[60,210,390,560,740].map((x,i)=><circle key={i} cx={x} cy={130+(x/900)*20} r="2" fill="#818CF8" opacity="0.35"/>)}
            </svg>
            {/* Light: left role badge */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none select-none hidden sm:flex">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                <span className="text-indigo-700 text-xs font-semibold tracking-wide uppercase">{profile?.userType === UserType.FREELANCER ? 'Freelancer' : profile?.userType === 'AGENT' ? 'Agent' : 'Mijoz'}</span>
              </div>
            </div>
            {/* Light: right chips */}
            <div className="absolute right-5 top-5 pointer-events-none select-none hidden sm:flex flex-col gap-2">
              {[{dot:'#059669',label:'Verified',glow:'#05966940'},{dot:'#d97706',label:'Top Rated',glow:'#d9770640'},{dot:'#6366f1',label:'Fast Reply',glow:'#6366f140'}].map(b=>(
                <div key={b.label} className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.dot, boxShadow: `0 0 6px 2px ${b.glow}` }} />
                  <span className="text-slate-700 text-xs font-medium">{b.label}</span>
                </div>
              ))}
            </div>
            {/* Light: bottom gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent 0%, #6366f1 20%, #0891b2 50%, #818CF8 80%, transparent 100%)', opacity: 0.5 }} />
          </>
        )}

      </div>

      {/* ── Main Content ── */}
      <div className="grid grid-cols-12 gap-6 -mt-16 relative z-10 pb-16 items-start">

        {/* ════ LEFT: Profile Details ════ */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* ── Profile Header Card ── */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: isDark ? '#16161F' : '#ffffff', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}>
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
                  <h1 className="text-2xl font-extrabold leading-tight" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
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
                  {profile && isJobBoostActive(profile) && (
                    <span className="px-2.5 py-0.5 text-[10px] font-black tracking-widest bg-violet-100 text-violet-700 rounded-full border border-violet-200">
                      {profile.boostPlan === 'VIP' ? 'VIP' : profile.boostPlan === 'PRO' ? 'PRO' : 'TOP'}
                    </span>
                  )}
                </div>

                <p className="text-sm mb-1" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>@{profile.username}</p>

                {/* Availability badge */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-4 ${isAvailable ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-amber-400'}`} />
                  {isAvailable ? "Yangi loyiha uchun bo'sh" : 'Band'}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4 py-4" style={{ borderTop: `1px solid ${isDark ? '#27272F' : '#f1f5f9'}`, borderBottom: `1px solid ${isDark ? '#27272F' : '#f1f5f9'}` }}>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="text-xl font-extrabold" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>
                        {profile.averageRating?.toFixed(1) ?? '5.0'}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Reyting</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold mb-0.5" style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}>{profile.completedJobCount ?? 0}</p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Bajarilgan</p>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold text-indigo-600 mb-0.5">
                      {profile.hourlyRate ? `$${profile.hourlyRate}` : '—'}
                    </p>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Soatlik</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-5 rounded-xl p-4" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#16161F' : '#e2e8f0'}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-indigo-500" />
                  <h3 className="text-sm font-bold" style={{ color: isDark ? '#a5b4fc' : '#4f46e5' }}>Men haqimda</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: isDark ? '#cbd5e1' : '#3A3A48', wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{profile.bio}</p>
              </div>
            )}
          </div>

          {/* ── Tabs ── */}
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ backgroundColor: isDark ? '#16161F' : '#ffffff', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}>
            {/* Tab nav */}
            <div className="flex" style={{ borderBottom: `1px solid ${isDark ? '#27272F' : '#f1f5f9'}` }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-all relative`}
                  style={{ color: activeTab === tab.key ? '#6366f1' : isDark ? '#94a3b8' : '#64748b' }}
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
                      { label: 'Kuzatuvchilar', value: displayFollowerCount, clr: '#6366f1' },
                      { label: 'Kuzatmoqda', value: profile.followingCount ?? 0, clr: '#0891b2' },
                      { label: "Ko'rishlar", value: profile.profileViewCount ?? 0, clr: '#7c3aed' },
                      { label: 'Bajarilgan', value: profile.completedJobCount ?? 0, clr: '#059669' },
                    ].map(({ label, value, clr }) => (
                      <div key={label} className="rounded-xl p-3.5 text-center" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#16161F' : '#e2e8f0'}` }}>
                        <p className="text-2xl font-black leading-none mb-1" style={{ color: clr }}>{value}</p>
                        <p className="text-[11px] font-medium" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>{label}</p>
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
                <div className="space-y-4">

                  {/* Hidden file input */}
                  <input
                    ref={inlinePortfolioFileRef}
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={handleInlinePortfolioFileChange}
                  />

                  {/* Add button for own profile */}
                  {isOwnProfile && !showInlineForm && (
                    <button
                      onClick={handleInlinePortfolioFilePick}
                      disabled={inlinePortfolioUploading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                      style={{ background: isDark ? 'linear-gradient(135deg,#312e81,#4f46e5)' : 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#ffffff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                    >
                      {inlinePortfolioUploading ? (
                        <>
                          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                          Yuklanmoqda...
                        </>
                      ) : (
                        <>
                          <AddIcon size={18} />
                          Portfolio qo&apos;shish (rasm yoki PDF)
                        </>
                      )}
                    </button>
                  )}

                  {/* Inline add form — after file uploaded */}
                  {isOwnProfile && showInlineForm && (
                    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', border: `1px solid ${isDark ? '#27272F' : '#c7d2fe'}` }}>
                      {/* Preview */}
                      {inlinePortfolioUrl && (
                        inlinePortfolioUrl.toLowerCase().includes('.pdf') ? (
                          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? '#16161F' : '#faf5ff' }}>
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ef4444' }}>
                              <span className="text-white text-[10px] font-black">PDF</span>
                            </div>
                            <span className="text-xs font-medium truncate" style={{ color: isDark ? '#e2e8f0' : '#374151' }}>Fayl yuklandi ✓</span>
                          </div>
                        ) : (
                          <div className="h-36 rounded-lg overflow-hidden">
                            <img src={inlinePortfolioUrl} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )
                      )}

                      {/* Title input */}
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Sarlavha *</label>
                        <input
                          type="text"
                          value={inlinePortfolioTitle}
                          onChange={e => setInlinePortfolioTitle(e.target.value)}
                          placeholder="Masalan: Web dizayn loyihasi"
                          maxLength={80}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                          style={{
                            backgroundColor: isDark ? '#16161F' : '#ffffff',
                            border: `1px solid ${isDark ? '#27272F' : '#d1d5db'}`,
                            color: isDark ? '#f1f5f9' : '#111827',
                          }}
                        />
                      </div>

                      {/* Description input */}
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Tavsif (ixtiyoriy)</label>
                        <textarea
                          value={inlinePortfolioDesc}
                          onChange={e => setInlinePortfolioDesc(e.target.value)}
                          placeholder="Loyiha haqida qisqacha..."
                          rows={2}
                          maxLength={300}
                          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
                          style={{
                            backgroundColor: isDark ? '#16161F' : '#ffffff',
                            border: `1px solid ${isDark ? '#27272F' : '#d1d5db'}`,
                            color: isDark ? '#f1f5f9' : '#111827',
                          }}
                        />
                      </div>

                      {inlinePortfolioError && (
                        <p className="text-xs text-red-500">{inlinePortfolioError}</p>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleInlinePortfolioSave}
                          disabled={!inlinePortfolioTitle.trim() || inlinePortfolioSaving}
                          className="flex-1 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: '#fff' }}
                        >
                          {inlinePortfolioSaving ? 'Saqlanmoqda...' : 'Saqlash'}
                        </button>
                        <button
                          onClick={handleInlinePortfolioCancel}
                          className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                          style={{ backgroundColor: isDark ? '#16161F' : '#f1f5f9', color: isDark ? '#94a3b8' : '#64748b', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}
                        >
                          Bekor
                        </button>
                      </div>
                    </div>
                  )}

                  {profile.portfolio && profile.portfolio.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.portfolio.map((item, idx) => (
                        <div
                          key={idx}
                          className="group rounded-xl overflow-hidden transition-all duration-200"
                          style={{ border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}
                        >
                          {item.imageUrl ? (
                            item.imageUrl.toLowerCase().includes('.pdf') ? (
                              <div className="p-4" style={{ backgroundColor: isDark ? '#16161F' : '#faf5ff' }}>
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ef4444' }}>
                                    <span className="text-white text-xs font-black">PDF</span>
                                  </div>
                                  <p className="text-sm font-semibold leading-snug flex-1" style={{ color: isDark ? '#e2e8f0' : '#16161F' }}>{item.title}</p>
                                </div>
                                <div className="flex gap-2">
                                  <a
                                    href={item.imageUrl.startsWith('/') ? item.imageUrl : `https://docs.google.com/viewer?url=${encodeURIComponent(item.imageUrl)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                    style={{ backgroundColor: '#6366f1', color: '#fff' }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    Ochish
                                  </a>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const r = await fetch(item.imageUrl);
                                        const blob = await r.blob();
                                        const blobUrl = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = blobUrl; a.download = item.title ? `${item.title}.pdf` : 'document.pdf';
                                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                                      } catch { window.open(item.imageUrl, '_blank'); }
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                    style={{ backgroundColor: isDark ? '#27272F' : '#e0e7ff', color: isDark ? '#e2e8f0' : '#4338ca' }}
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                    Yuklash
                                  </button>
                                  {isOwnProfile && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Bu portfolioni o\'chirishni tasdiqlaysizmi?')) return;
                                        const updated = (profile.portfolio ?? []).filter((_, i) => i !== idx).map((p: any) => ({ title: p.title, imageUrl: p.imageUrl, description: p.description ?? '' }));
                                        await updateProfile({ variables: { input: { portfolio: updated } } });
                                        refetch();
                                      }}
                                      className="flex items-center justify-center px-2.5 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                                      style={{ backgroundColor: isDark ? '#3f1515' : '#fee2e2', color: '#ef4444' }}
                                      title="O'chirish"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="h-44 overflow-hidden" style={{ backgroundColor: isDark ? '#27272F' : '#f1f5f9' }}>
                                  <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                {isOwnProfile && (
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Bu portfolioni o\'chirishni tasdiqlaysizmi?')) return;
                                      const updated = (profile.portfolio ?? []).filter((_, i) => i !== idx).map((p: any) => ({ title: p.title, imageUrl: p.imageUrl, description: p.description ?? '' }));
                                      await updateProfile({ variables: { input: { portfolio: updated } } });
                                      refetch();
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                    style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff' }}
                                    title="O'chirish"
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                  </button>
                                )}
                              </div>
                            )
                          ) : (
                            <div className="h-32 flex items-center justify-center" style={{ backgroundColor: isDark ? '#27272F' : '#f1f5f9' }}>
                              <ImageIcon size={36} color={isDark ? '#3A3A48' : '#94a3b8'} />
                            </div>
                          )}
                          <div className="p-4 flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold mb-1" style={{ color: isDark ? '#f1f5f9' : '#16161F' }}>{item.title}</h4>
                              {item.description && (
                                <p className="text-xs leading-relaxed" style={{ color: isDark ? '#94a3b8' : '#64748b', wordBreak: 'break-word' }}>{item.description}</p>
                              )}
                            </div>
                            {isOwnProfile && !item.imageUrl?.toLowerCase().includes('.pdf') && (
                              <button
                                onClick={async () => {
                                  if (!confirm('Bu portfolioni o\'chirishni tasdiqlaysizmi?')) return;
                                  const updated = (profile.portfolio ?? []).filter((_, i) => i !== idx).map((p: any) => ({ title: p.title, imageUrl: p.imageUrl, description: p.description ?? '' }));
                                  await updateProfile({ variables: { input: { portfolio: updated } } });
                                  refetch();
                                }}
                                className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-90"
                                style={{ backgroundColor: isDark ? '#3f1515' : '#fee2e2', color: '#ef4444' }}
                                title="O'chirish"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon size={40} color={isDark ? '#3A3A48' : '#cbd5e1'} />
                      <p className="mt-3 text-sm" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Portfolio bo&apos;sh</p>
                      {isOwnProfile && <p className="mt-1 text-xs" style={{ color: isDark ? '#3A3A48' : '#cbd5e1' }}>Yuqoridagi tugmani bosib qo&apos;shing</p>}
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
            <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: isDark ? '#16161F' : '#ffffff', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}>
              {/* Availability */}
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Xizmat mavjudligi</p>
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
                <div className="space-y-3">
                  {canProfileBoost && ownProfile && (
                    <>
                      <BoostProfileStats user={ownProfile} />
                      {ownProfile.boostPaymentStatus !== 'PENDING' &&
                        !isJobBoostActive(ownProfile) && (
                          <button
                            type="button"
                            onClick={() => setProfileBoostOpen(true)}
                            className="w-full py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-200/60 hover:opacity-95 transition-all"
                          >
                            <BoltIcon size={18} weight="fill" />
                            Profilni boost qilish
                          </button>
                        )}
                    </>
                  )}
                  <button
                    type="button"
                    onClick={openEditDialog}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold border border-indigo-200 text-indigo-600 flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all duration-200"
                  >
                    <EditIcon size={18} />
                    Profilni tahrirlash
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <button className="w-full py-3.5 rounded-xl text-sm font-bold bg-indigo-600 text-white flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors">
                    <BoltIcon size={18} />
                    Ish taklif qilish
                  </button>
                </Link>
              )}

              {/* Meta info */}
              <div className="mt-6 pt-5 space-y-3" style={{ borderTop: `1px solid ${isDark ? '#27272F' : '#f1f5f9'}` }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Javob vaqti</span>
                  <span className="text-sm font-semibold" style={{ color: isDark ? '#e2e8f0' : '#16161F' }}>~2 soat</span>
                </div>
                {profile.location && (
                  <div>
                    <span className="text-sm block mb-2" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Joylashuv</span>
                    <MiniMap
                      address={profile.location}
                      height={150}
                      isDark={isDark}
                      destinationName={profile.fullName ?? profile.username}
                      destAvatar={profile.profileImage}
                      userAvatar={currentUser.profileImage}
                    />
                  </div>
                )}
                {memberSince && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>A&apos;zo bo&apos;lgan</span>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: isDark ? '#e2e8f0' : '#16161F' }}>
                      <CalendarBlank size={13} style={{ color: isDark ? '#64748b' : '#94a3b8' }} />
                      {memberSince}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Share card */}
            <div className="rounded-2xl p-4 flex items-center justify-between" style={{ backgroundColor: isDark ? '#16161F' : '#f8fafc', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>Profilni ulashish</p>
                <p className="text-sm font-semibold truncate" style={{ color: isDark ? '#e2e8f0' : '#27272F' }}>
                  bufu.uz/{profile.username}
                </p>
              </div>
              <button
                onClick={handleCopyProfile}
                className="ml-3 flex-shrink-0 p-2.5 rounded-xl text-indigo-500 hover:bg-indigo-50 transition-colors"
                style={{ backgroundColor: isDark ? '#16161F' : '#ffffff', border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}` }}
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
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? '#16161F' : '#ffffff',
            border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
            overflow: 'hidden',
          }
        }}
      >
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography fontWeight={800} fontSize={15} color="white">
              {router.query.onboard === 'true' ? "Freelancer Profilini To'ldiring" : 'Profilni tahrirlash'}
            </Typography>
            {router.query.onboard === 'true' && (
              <Typography fontSize={12} color="rgba(255,255,255,0.75)" mt={0.3}>
                Profilingizni to&apos;ldiring — mijozlar sizi osonroq topishadi
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setEditOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <ArrowLeftIcon size={18} style={{ transform: 'rotate(45deg) scale(0.9)' }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2.5 }}>
            {saveError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{saveError}</Alert>}
            {saveSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{saveSuccess}</Alert>}

            <Stack spacing={3}>
              {/* Avatar section */}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
              <input ref={portfolioFileInputRef} type="file" accept="image/*,.pdf,application/pdf" style={{ display: 'none' }} onChange={handlePortfolioFileChange} />

              <Box sx={{
                display: 'flex', alignItems: 'center', gap: 2.5, p: 2, borderRadius: 2.5,
                bgcolor: isDark ? '#0f172a' : '#f8fafc',
                border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
              }}>
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={profileImage || undefined}
                    onClick={handleAvatarPick}
                    sx={{ width: 72, height: 72, bgcolor: '#4f46e5', fontSize: 26, cursor: 'pointer', border: '3px solid', borderColor: isDark ? '#27272F' : '#e2e8f0', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }}
                  >
                    {(fullName || currentUser.username)?.[0]?.toUpperCase()}
                  </Avatar>
                  {avatarUploading && (
                    <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', bgcolor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress size={22} sx={{ color: 'white' }} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <Typography fontWeight={700} fontSize={14} color={isDark ? '#f1f5f9' : '#0f172a'}>
                    {fullName || currentUser.username}
                  </Typography>
                  <Typography fontSize={12} color={isDark ? '#64748b' : '#94a3b8'} mb={1}>
                    Rasmni o&apos;zgartirish uchun bosing
                  </Typography>
                  <Button size="small" variant="outlined" startIcon={<PhotoCameraIcon size={15} />}
                    onClick={handleAvatarPick} disabled={avatarUploading}
                    sx={{ fontSize: 11, borderColor: isDark ? '#27272F' : '#e2e8f0', color: '#6366f1', borderRadius: 2, py: 0.4, textTransform: 'none' }}>
                    {avatarUploading ? 'Yuklanmoqda...' : 'Rasm tanlash'}
                  </Button>
                </Box>
              </Box>

              {/* Basic fields */}
              <Box>
                <Typography fontSize={11} fontWeight={700} color={isDark ? '#64748b' : '#94a3b8'} textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                  Asosiy ma&apos;lumotlar
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth size="small" label="To'liq ism" placeholder="Otabek Ikromov"
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    {/* Manzil — map modal bilan */}
                    <Box sx={{ position: 'relative' }}>
                      <TextField fullWidth size="small" label="Manzil"
                        placeholder="Xaritadan tanlang..."
                        value={location}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocation(val);
                          if (locationTimer.current) clearTimeout(locationTimer.current);
                          if (val.trim().length < 2) { setLocationSuggests([]); return; }
                          locationTimer.current = setTimeout(async () => {
                            const s = await getYandexSuggests(val);
                            setLocationSuggests(s);
                          }, 350);
                        }}
                        InputProps={{
                          startAdornment: (
                            <Box component="span" sx={{ display: 'flex', mr: 0.5 }}>
                              <MapPin size={15} color="#6366f1" weight="fill" />
                            </Box>
                          ),
                          endAdornment: (
                            <Box onClick={() => setEditMapOpen(true)} sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', px: 0.8, py: 0.3, borderRadius: 1.5, bgcolor: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)', '&:hover': { bgcolor: 'rgba(99,102,241,0.18)' } }}>
                              <MapPin size={11} color="#6366f1" weight="fill" />
                              <Typography fontSize={10} color="#6366f1" fontWeight={700}>Xarita</Typography>
                            </Box>
                          ),
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff', cursor: 'text' } }}
                      />
                      {locationSuggests.length > 0 && (
                        <Box sx={{
                          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999,
                          mt: 0.5, borderRadius: 2, overflow: 'hidden',
                          border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
                          bgcolor: isDark ? '#16161F' : '#ffffff',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        }}>
                          {locationSuggests.map((s, i) => (
                            <Box key={i} onClick={() => { setLocation(s); setLocationSuggests([]); }} sx={{
                              display: 'flex', alignItems: 'flex-start', gap: 1, px: 1.5, py: 1, cursor: 'pointer',
                              borderBottom: i < locationSuggests.length - 1 ? `1px solid ${isDark ? '#27272F' : '#f1f5f9'}` : 'none',
                              '&:hover': { bgcolor: isDark ? '#0f172a' : '#f8fafc' },
                            }}>
                              <MapPin size={12} color="#6366f1" weight="fill" style={{ flexShrink: 0, marginTop: 2 }} />
                              <Typography fontSize={12} color={isDark ? '#e2e8f0' : '#16161F'} sx={{ lineHeight: 1.4 }}>{s}</Typography>
                            </Box>
                          ))}
                        </Box>
                      )}
                      <MapModal
                        open={editMapOpen}
                        onClose={() => setEditMapOpen(false)}
                        onSelect={(addr) => { setLocation(addr); setLocationSuggests([]); }}
                        initialAddress={location}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth multiline rows={3} label="Bio"
                      placeholder="O'zingiz haqida yozing..."
                      value={bio} onChange={(e) => setBio(e.target.value)}
                      inputProps={{ maxLength: 500 }}
                      helperText={`${bio.length}/500`}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff' } }} />
                  </Grid>
                </Grid>
              </Box>

              {isFreelancer && (
                <>
                  <Box>
                    <Typography fontSize={11} fontWeight={700} color={isDark ? '#64748b' : '#94a3b8'} textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                      Freelancer sozlamalari
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Mutaxassislik</InputLabel>
                          <Select value={freelancerCategory} label="Mutaxassislik"
                            onChange={(e) => setFreelancerCategory(e.target.value)}
                            sx={{ borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff' }}>
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
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff' } }} />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography fontSize={12} fontWeight={600} color={isDark ? '#94a3b8' : '#64748b'} mb={1}>Bandlik holati</Typography>
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
                  </Box>

                  {/* Ko'nikmalar */}
                  <Box>
                    <Typography fontSize={11} fontWeight={700} color={isDark ? '#64748b' : '#94a3b8'} textTransform="uppercase" letterSpacing={0.8} mb={1.5}>
                      Ko&apos;nikmalar
                    </Typography>
                    <Stack direction="row" spacing={1} mb={1.5}>
                      <TextField size="small" placeholder="Masalan: AutoCAD, 3D Max"
                        value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: isDark ? '#0f172a' : '#ffffff' } }} />
                      <Button variant="outlined" onClick={addSkill} size="small"
                        sx={{ borderColor: isDark ? '#27272F' : '#e2e8f0', color: '#6366f1', borderRadius: 2, minWidth: 40 }}>
                        <AddIcon size={20} />
                      </Button>
                    </Stack>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      {skills.map((s) => (
                        <Chip key={s} label={s} size="small"
                          onDelete={() => setSkills(prev => prev.filter(x => x !== s))}
                          sx={{ fontSize: 11, bgcolor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: '#6366f1', border: `1px solid ${isDark ? '#27272F' : '#c7d2fe'}` }} />
                      ))}
                      {skills.length === 0 && (
                        <Typography fontSize={12} color={isDark ? '#3A3A48' : '#94a3b8'}>Ko&apos;nikma qo&apos;shilmagan</Typography>
                      )}
                    </Stack>
                  </Box>

                  {/* Portfel */}
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                      <Typography fontSize={11} fontWeight={700} color={isDark ? '#64748b' : '#94a3b8'} textTransform="uppercase" letterSpacing={0.8}>
                        Portfel
                      </Typography>
                      <Button size="small" variant="outlined" startIcon={<AddIcon size={16} />}
                        onClick={addPortfolioItem}
                        sx={{ fontSize: 11, borderColor: isDark ? '#27272F' : '#e2e8f0', color: '#6366f1', py: 0.25, borderRadius: 1.5, textTransform: 'none' }}>
                        Qo&apos;shish
                      </Button>
                    </Stack>

                    {portfolio.length === 0 ? (
                      <Box onClick={addPortfolioItem} sx={{
                        py: 4, textAlign: 'center', border: `2px dashed ${isDark ? '#27272F' : '#e2e8f0'}`,
                        borderRadius: 2.5, cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { borderColor: '#6366f1', bgcolor: isDark ? 'rgba(99,102,241,0.05)' : '#f5f3ff' },
                      }}>
                        <ImageIcon size={28} color={isDark ? '#3A3A48' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
                        <Typography fontSize={13} color={isDark ? '#3A3A48' : '#94a3b8'}>Portfel yo&apos;q. Qo&apos;shish uchun bosing.</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {portfolio.map((item, idx) => (
                          <Box key={idx} sx={{ p: 2, borderRadius: 2, border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                              <Typography fontSize={12} fontWeight={600} color={isDark ? '#94a3b8' : '#64748b'}>#{idx + 1} element</Typography>
                              <IconButton size="small" onClick={() => removePortfolioItem(idx)}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: isDark ? '#3f1515' : '#fef2f2' } }}>
                                <DeleteIcon size={16} />
                              </IconButton>
                            </Stack>
                            <Box onClick={() => handlePortfolioImagePick(idx)} sx={{
                              height: 100, borderRadius: 2, mb: 1.5, overflow: 'hidden',
                              border: `2px dashed ${isDark ? '#27272F' : '#e2e8f0'}`,
                              cursor: 'pointer', position: 'relative',
                              bgcolor: isDark ? '#16161F' : '#f1f5f9',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              '&:hover': { borderColor: '#6366f1' },
                            }}>
                              {portfolioUploadingIdx === idx ? (
                                <CircularProgress size={24} sx={{ color: '#6366f1' }} />
                              ) : item.imageUrl ? (
                                <>
                                  <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                                  <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.3)', opacity: 0, transition: '0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', '&:hover': { opacity: 1 } }}>
                                    <PhotoCameraIcon size={24} color="#fff" />
                                  </Box>
                                </>
                              ) : (
                                <Stack alignItems="center" spacing={0.5}>
                                  <PhotoCameraIcon size={24} color={isDark ? '#3A3A48' : '#94a3b8'} />
                                  <Typography fontSize={11} color={isDark ? '#3A3A48' : '#94a3b8'}>Fayl tanlash</Typography>
                                </Stack>
                              )}
                            </Box>
                            <Grid container spacing={1}>
                              <Grid item xs={12}>
                                <TextField fullWidth size="small" label="Sarlavha"
                                  value={item.title} onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isDark ? '#16161F' : '#ffffff' } }} />
                              </Grid>
                              <Grid item xs={12}>
                                <TextField fullWidth size="small" label="Tavsif"
                                  value={item.description} onChange={(e) => updatePortfolioItem(idx, 'description', e.target.value)}
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: isDark ? '#16161F' : '#ffffff' } }} />
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
          </Box>
        </DialogContent>

        <Box sx={{
          px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5,
          borderTop: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
          bgcolor: isDark ? '#0f172a' : '#f8fafc',
        }}>
          <Button onClick={() => setEditOpen(false)}
            sx={{ color: isDark ? '#94a3b8' : '#64748b', borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || avatarUploading || portfolioUploadingIdx !== null}
            startIcon={saving ? <CircularProgress size={15} sx={{ color: 'white' }} /> : <SaveIcon size={17} />}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, px: 3, borderRadius: 2, fontWeight: 700, textTransform: 'none', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
          >
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </Box>
      </Dialog>

      <BoostModal
        open={profileBoostOpen}
        subjectTitle={ownProfile?.fullName ?? ownProfile?.username ?? 'Profil'}
        subjectKind="profile"
        onClose={() => setProfileBoostOpen(false)}
        onSubmitReceipt={async (plan, receiptUrl) => {
          await submitProfileBoostPayment({ variables: { plan, receiptUrl } });
          setProfileBoostOpen(false);
          await refetch();
          await refetchMyProfile();
          alert('Chek yuborildi. Admin tasdiqlagach profil boost yoqiladi.');
        }}
      />
    </>
  );
};

export default withLayoutBasic(ProfilePage);
