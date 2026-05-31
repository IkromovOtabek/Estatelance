import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  User as PersonOutlineIcon,
  Lock as LockOutlinedIcon,
  IdentificationCard as BadgeOutlinedIcon,
  House,
  Lightning,
  ShieldCheck,
  Globe,
  Palette,
  Camera,
  UploadSimple,
  HouseLine,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
} from '@phosphor-icons/react';
import { loginWithPassword, signupWithPassword, loginWithTelegram } from '../../libs/auth';
import { saveToken } from '../../apollo/client';
import TelegramLoginButton from '../../libs/components/common/TelegramLoginButton';
import { UPDATE_PROFILE } from '../../apollo/user/mutation';
import { JobCategory, JOB_CATEGORY_LABELS, UserType } from '../../libs/enums';
import { userVar } from '../../apollo/store';
import { useMutation, useReactiveVar } from '@apollo/client';

// ─── Kirish va Ro'yxatdan o'tish sahifasi ────────────────────────────────────

const FEATURES = [
  { icon: <Palette size={18} color="#a5b4fc" weight="fill" />, text: 'Frilanserlar uchun maxsus platforma' },
  { icon: <Lightning size={18} color="#a5b4fc" weight="fill" />, text: 'Tez ish toping yoki frilanser yollang' },
  { icon: <ShieldCheck size={18} color="#a5b4fc" weight="fill" />, text: "Xavfsiz to'lov va shartnomalar" },
  { icon: <Globe size={18} color="#a5b4fc" weight="fill" />, text: "O'zbekiston bo'ylab 100+ mutaxassis" },
];

function getInitials(name: string, fallback = ''): string {
  const source = name.trim() || fallback.trim();
  if (!source) return '';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

// ── BuFu Logo SVG ─────────────────────────────────────────────────────────────
const BuFuLogoSvg = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="5" width="10" height="22" rx="2" fill="white" />
    <rect x="13" y="5" width="8" height="4.5" rx="2" fill="white" />
    <rect x="13" y="13" width="7" height="4" rx="2" fill="white" />
    <rect x="13" y="22.5" width="8" height="4.5" rx="2" fill="white" />
    <rect x="19" y="5" width="4" height="22" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="19" y="5" width="10" height="4.5" rx="2" fill="rgba(255,255,255,0.5)" />
    <rect x="19" y="13" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)" />
  </svg>
);

const AccountPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  // ── Tab holatlar: 'login' | 'signup' ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  // ── Login holatlari ────────────────────────────────────────────────────────
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ── Signup ko'p bosqichli holatlari ───────────────────────────────────────
  const [signupStep, setSignupStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserType | ''>('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);

  // ── Umumiy holatlar ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ── Onboarding (Telegram kirish keyin) ────────────────────────────────────
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingRole, setOnboardingRole] = useState<UserType | ''>('');
  const [onboardingFullName, setOnboardingFullName] = useState('');
  const [onboardingLocation, setOnboardingLocation] = useState('Toshkent, UZ');
  const [onboardingBio, setOnboardingBio] = useState('');
  const [onboardingImage, setOnboardingImage] = useState('');
  const [onboardingCategory, setOnboardingCategory] = useState('');
  const [onboardingHourlyRate, setOnboardingHourlyRate] = useState('');
  const [onboardingSkills, setOnboardingSkills] = useState<string[]>([]);
  const [onboardingSkillInput, setOnboardingSkillInput] = useState('');
  const [onboardingResumeFile, setOnboardingResumeFile] = useState<File | null>(null);
  const [onboardingResumeData, setOnboardingResumeData] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const pendingOnboarding = useRef(false);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    setSessionChecked(true);
  }, []);

  useEffect(() => {
    if (!sessionChecked) return;
    if (user._id && user.needsOnboarding) {
      pendingOnboarding.current = true;
      setOnboardingOpen(true);
    } else if (user._id && !pendingOnboarding.current) {
      router.replace('/');
    }
  }, [sessionChecked, user._id, user.needsOnboarding]);

  if (!sessionChecked) return null;
  if (user._id && !user.needsOnboarding) return null;

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '';

  // ── Skills ──────────────────────────────────────────────────────────────────
  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
  };
  const removeSkill = (skill: string) => setSkills((prev) => prev.filter((s) => s !== skill));

  // ── Profile image ──────────────────────────────────────────────────────────
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrorMessage("Faqat rasm faylini yuklash mumkin."); return; }
    if (file.size > 2 * 1024 * 1024) { setErrorMessage('Rasm hajmi 2MB dan oshmasin.'); return; }
    const reader = new FileReader();
    reader.onload = () => { setProfileImage(String(reader.result)); setErrorMessage(''); };
    reader.readAsDataURL(file);
  };

  // ── Login submit ───────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await loginWithPassword(loginUsername, loginPassword);
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Register step 1 → 2 ───────────────────────────────────────────────────
  const handleRoleContinue = () => {
    if (!selectedRole) return;
    setErrorMessage('');
    setSignupStep(2);
  };

  // ── Register step 2 submit ────────────────────────────────────────────────
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await signupWithPassword(username, password, selectedRole as UserType, fullName, location, profileImage);

      const profileInput: any = {};
      if (fullName.trim()) profileInput.fullName = fullName.trim();
      if (location.trim()) profileInput.location = location.trim();
      if (profileImage) profileInput.profileImage = profileImage;
      if (bio.trim()) profileInput.bio = bio.trim();

      if (selectedRole === UserType.FREELANCER) {
        if (freelancerCategory) profileInput.freelancerCategory = freelancerCategory;
        if (hourlyRate && !isNaN(Number(hourlyRate))) profileInput.hourlyRate = Number(hourlyRate);
        if (skills.length > 0) profileInput.skills = skills;
      }

      if (Object.keys(profileInput).length > 0) {
        const result = await updateProfile({ variables: { input: profileInput } });
        const updated = result?.data?.updateProfile;
        if (updated) {
          if (updated.accessToken) saveToken(updated.accessToken);
          userVar({ ...userVar(), fullName: updated.fullName ?? fullName, profileImage: updated.profileImage ?? '' });
        }
      }

      const newUser = userVar();
      if (selectedRole === UserType.FREELANCER && newUser._id) {
        router.push(`/profile/${newUser._id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Telegram auth ──────────────────────────────────────────────────────────
  const handleTelegramAuth = async (telegramData: any) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      pendingOnboarding.current = true;
      const needsOnboarding = await loginWithTelegram(telegramData);
      if (needsOnboarding) {
        setOnboardingOpen(true);
      } else {
        pendingOnboarding.current = false;
        router.push('/');
      }
    } catch (err: any) {
      pendingOnboarding.current = false;
      setErrorMessage(err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Telegram orqali kirishda xatolik.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Onboarding handlers ────────────────────────────────────────────────────
  const handleOnboardingNext = () => { if (!onboardingRole) return; setOnboardingStep(2); };
  const handleOnboardingBack = () => setOnboardingStep(1);

  const handleOnboardingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setOnboardingImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleOnboardingResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) return;
    setOnboardingResumeFile(file);
    const reader = new FileReader();
    reader.onload = () => setOnboardingResumeData(String(reader.result));
    reader.readAsDataURL(file);
  };

  const addOnboardingSkill = () => {
    const trimmed = onboardingSkillInput.trim();
    if (!trimmed || onboardingSkills.includes(trimmed)) return;
    setOnboardingSkills((prev) => [...prev, trimmed]);
    setOnboardingSkillInput('');
  };

  const handleOnboardingSubmit = async () => {
    if (!onboardingRole) return;
    if (!onboardingPhone.trim()) { setErrorMessage('Telefon raqam kiritish majburiy.'); return; }
    setOnboardingLoading(true);
    try {
      const input: any = { userType: onboardingRole };
      if (onboardingFullName.trim()) input.fullName = onboardingFullName.trim();
      if (onboardingLocation.trim()) input.location = onboardingLocation.trim();
      if (onboardingBio.trim()) input.bio = onboardingBio.trim();
      if (onboardingImage) input.profileImage = onboardingImage;
      if (onboardingPhone.trim()) input.phoneNumber = onboardingPhone.trim();
      if (onboardingRole === UserType.FREELANCER) {
        if (onboardingCategory) input.freelancerCategory = onboardingCategory;
        if (onboardingHourlyRate && !isNaN(Number(onboardingHourlyRate))) input.hourlyRate = Number(onboardingHourlyRate);
        if (onboardingSkills.length > 0) input.skills = onboardingSkills;
        if (onboardingResumeData) input.resumeUrl = onboardingResumeData;
      }

      const result = await updateProfile({ variables: { input } });
      const updated = result?.data?.updateProfile;

      if (updated?.accessToken) {
        const { jwtDecode } = await import('jwt-decode');
        saveToken(updated.accessToken);
        const { setUserFromToken } = await import('../../apollo/store');
        setUserFromToken(jwtDecode(updated.accessToken));
      } else {
        userVar({
          ...userVar(),
          userType: onboardingRole as UserType,
          fullName: onboardingFullName || userVar().fullName,
          profileImage: onboardingImage || userVar().profileImage,
          needsOnboarding: false,
        });
      }
      pendingOnboarding.current = false;
      setOnboardingOpen(false);
      const currentUser = userVar();
      if (onboardingRole === UserType.FREELANCER && currentUser._id) {
        router.push(`/profile/${currentUser._id}`);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      pendingOnboarding.current = false;
      setErrorMessage(err?.graphQLErrors?.[0]?.message ?? 'Xatolik yuz berdi.');
      setOnboardingOpen(false);
    } finally {
      setOnboardingLoading(false);
    }
  };

  // ── Progress % for signup ──────────────────────────────────────────────────
  const signupProgress = signupStep === 1 ? 33 : 66;

  return (
    <>
      <Head>
        <title>{activeTab === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"} — BuFu</title>
      </Head>

      {/* ── Onboarding Dialog ── */}
      <Dialog
        open={onboardingOpen}
        maxWidth="xs"
        fullWidth
        onClose={() => { pendingOnboarding.current = false; setOnboardingOpen(false); setOnboardingStep(1); setOnboardingRole(''); }}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Box sx={{ height: 4, bgcolor: '#e2e8f0' }}>
            <Box sx={{ height: '100%', bgcolor: '#3525cd', width: onboardingStep === 1 ? '50%' : '100%', transition: 'width 0.4s ease' }} />
          </Box>
          <Stack direction="row" justifyContent="center" spacing={1} pt={2.5} px={4}>
            {[1, 2].map((s) => (
              <Box key={s} sx={{ width: s === onboardingStep ? 24 : 8, height: 8, borderRadius: 4, bgcolor: s <= onboardingStep ? '#3525cd' : '#e2e8f0', transition: 'all 0.3s ease' }} />
            ))}
          </Stack>

          <Box sx={{ position: 'relative', overflow: 'hidden' }}>
            {/* Step 1 */}
            <Box sx={{ p: 4, pt: 2.5, transform: onboardingStep === 1 ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', position: onboardingStep === 1 ? 'relative' : 'absolute', top: 0, left: 0, width: '100%' }}>
              <Typography variant="h6" fontWeight={800} color="#131b2e" mb={0.5} textAlign="center">Xush kelibsiz!</Typography>
              <Typography fontSize={13} color="text.secondary" textAlign="center" mb={3}>Siz platformadan nima uchun foydalanasiz?</Typography>
              <Stack spacing={1.5} mb={3}>
                {[
                  { role: UserType.AGENT, icon: <Briefcase size={22} color="#3525cd" weight="fill" />, title: 'Ish beruvchi', desc: 'Ish joylayman va mutaxassis yollayman' },
                  { role: UserType.FREELANCER, icon: <Palette size={22} color="#3525cd" weight="fill" />, title: 'Frilanser', desc: "Profil ochib, ishlarga taklif yuboraman" },
                ].map(({ role, icon, title, desc }) => (
                  <Box key={role} onClick={() => setOnboardingRole(role)} sx={{ p: 2, border: `2px solid ${onboardingRole === role ? '#3525cd' : '#e2e8f0'}`, bgcolor: onboardingRole === role ? '#f2f3ff' : 'white', borderRadius: 2.5, cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: onboardingRole === role ? '0 0 0 4px rgba(53,37,205,0.1)' : 'none', '&:hover': { borderColor: '#3525cd', bgcolor: '#f2f3ff' } }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 44, height: 44, bgcolor: onboardingRole === role ? '#c3c0ff' : '#e2dfff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>{icon}</Box>
                      <Box>
                        <Typography fontWeight={700} fontSize={14} color="#131b2e">{title}</Typography>
                        <Typography fontSize={12} color="text.secondary">{desc}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              <Button fullWidth variant="contained" disabled={!onboardingRole} onClick={handleOnboardingNext} sx={{ bgcolor: '#3525cd', '&:hover': { bgcolor: '#2a1da8' }, borderRadius: 2, py: 1.3, fontWeight: 700 }}>
                Keyingisi →
              </Button>
            </Box>

            {/* Step 2 */}
            <Box sx={{ p: 3, pt: 2, transform: onboardingStep === 2 ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', position: onboardingStep === 2 ? 'relative' : 'absolute', top: 0, left: 0, width: '100%', maxHeight: '70vh', overflowY: 'auto', '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 } }}>
              <Typography variant="h6" fontWeight={800} color="#131b2e" mb={0.25} textAlign="center">Profilingizni to'ldiring</Typography>
              <Typography fontSize={12} color="text.secondary" textAlign="center" mb={2.5}>Bu ma'lumotlar boshqa foydalanuvchilarga ko'rinadi</Typography>
              <Stack spacing={1.75}>
                <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px dashed #c7c4d8', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: '#3525cd', bgcolor: '#f2f3ff' } }}>
                  <input type="file" accept="image/*" hidden onChange={handleOnboardingImageChange} />
                  <Avatar src={onboardingImage || undefined} sx={{ width: 48, height: 48, bgcolor: '#3525cd', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {getInitials(onboardingImage ? '' : (userVar().fullName || userVar().username || ''))}
                  </Avatar>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Camera size={14} color="#3525cd" weight="fill" />
                      <Typography fontSize={13} fontWeight={700} color="#3525cd">{onboardingImage ? 'Rasm tanlandi' : 'Profil rasmi yuklash'}</Typography>
                    </Stack>
                    <Typography fontSize={11} color="#94a3b8">JPG, PNG · max 2MB</Typography>
                  </Box>
                </Box>
                <TextField label="To'liq ism" value={onboardingFullName} onChange={(e) => setOnboardingFullName(e.target.value)} size="small" fullWidth placeholder="Otabek Ikromov" InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon size={17} color="#94a3b8" /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                <TextField label="Manzil" value={onboardingLocation} onChange={(e) => setOnboardingLocation(e.target.value)} size="small" fullWidth placeholder="Toshkent, UZ" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                <TextField label="Telefon raqam *" value={onboardingPhone} onChange={(e) => setOnboardingPhone(e.target.value)} size="small" fullWidth placeholder="+998 90 123 45 67" helperText="Oxirgi 4 ta raqam boshqa foydalanuvchilarga ko'rinadi" FormHelperTextProps={{ sx: { fontSize: 11, color: '#94a3b8', mx: 0 } }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                {onboardingRole === UserType.FREELANCER && (
                  <>
                    <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}>
                      <InputLabel>Ixtisoslik yo'nalishi</InputLabel>
                      <Select value={onboardingCategory} label="Ixtisoslik yo'nalishi" onChange={(e) => setOnboardingCategory(e.target.value)}>
                        {Object.values(JobCategory).map((cat) => (<MenuItem key={cat} value={cat} sx={{ fontSize: 13 }}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>))}
                      </Select>
                    </FormControl>
                    <TextField label="Soatlik narx (USD)" value={onboardingHourlyRate} onChange={(e) => setOnboardingHourlyRate(e.target.value)} type="number" size="small" fullWidth placeholder="25" inputProps={{ min: 0, step: 1 }} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                    <Box>
                      <Stack direction="row" spacing={1}>
                        <TextField label="Ko'nikmalar" value={onboardingSkillInput} onChange={(e) => setOnboardingSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOnboardingSkill(); } }} size="small" fullWidth placeholder="AutoCAD, SMM, Figma" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
                        <Button variant="outlined" onClick={addOnboardingSkill} sx={{ borderColor: '#e2e8f0', color: '#3525cd', minWidth: 70, fontSize: 12 }}>Qo'sh</Button>
                      </Stack>
                      {onboardingSkills.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
                          {onboardingSkills.map((skill) => (<Chip key={skill} label={skill} size="small" onDelete={() => setOnboardingSkills((p) => p.filter((s) => s !== skill))} />))}
                        </Stack>
                      )}
                    </Box>
                    <Box component="label" sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: `1px dashed ${onboardingResumeFile ? '#16a34a' : '#c7c4d8'}`, bgcolor: onboardingResumeFile ? '#f0fdf4' : 'white', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: '#3525cd', bgcolor: '#f2f3ff' } }}>
                      <input type="file" accept=".pdf,.doc,.docx,.txt" hidden onChange={handleOnboardingResumeChange} />
                      <Box sx={{ width: 40, height: 40, borderRadius: 1.5, flexShrink: 0, bgcolor: onboardingResumeFile ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UploadSimple size={18} color={onboardingResumeFile ? '#16a34a' : '#94a3b8'} weight="bold" />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13} fontWeight={700} color={onboardingResumeFile ? '#16a34a' : '#475569'}>{onboardingResumeFile ? onboardingResumeFile.name : 'Resume yuklash (ixtiyoriy)'}</Typography>
                        <Typography fontSize={11} color="#94a3b8">{onboardingResumeFile ? `${(onboardingResumeFile.size / 1024).toFixed(0)} KB` : 'PDF, DOC, DOCX · max 10MB'}</Typography>
                      </Box>
                    </Box>
                  </>
                )}
                <TextField value={onboardingBio} onChange={(e) => setOnboardingBio(e.target.value)} label={onboardingRole === UserType.FREELANCER ? 'Tajribangiz haqida' : 'Qanday ishchi izlayapsiz?'} size="small" fullWidth multiline rows={3} placeholder={onboardingRole === UserType.FREELANCER ? 'Qanday xizmatlar qilasiz, tajribangiz...' : "Qaysi yo'nalishda mutaxassis kerak..."} sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }} />
              </Stack>
              <Stack direction="row" spacing={1.5} mt={2.5}>
                <Button variant="outlined" onClick={handleOnboardingBack} sx={{ borderColor: '#e2e8f0', color: '#64748b', borderRadius: 2, py: 1.2, fontWeight: 600, minWidth: 80 }}>← Orqaga</Button>
                <Button fullWidth variant="contained" disabled={onboardingLoading} onClick={handleOnboardingSubmit} sx={{ bgcolor: '#3525cd', '&:hover': { bgcolor: '#2a1da8' }, borderRadius: 2, py: 1.2, fontWeight: 700 }}>
                  {onboardingLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: 'white' }} /><span>Saqlanmoqda...</span></Stack> : 'Boshlash'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* ── Asosiy sahifa ── */}
      <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative', bgcolor: '#faf8ff' }}>

        {/* Uy sahifasiga qaytish tugmasi */}
        <IconButton
          aria-label="Asosiy sahifaga qaytish"
          onClick={() => router.push('/')}
          sx={{ position: 'absolute', top: { xs: 16, md: 24 }, right: { xs: 16, md: 24 }, zIndex: 5, width: 42, height: 42, bgcolor: 'white', color: '#3525cd', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(53,37,205,0.1)', '&:hover': { bgcolor: '#f2f3ff', borderColor: '#c3c0ff' } }}
        >
          <HouseLine size={21} weight="fill" />
        </IconButton>

        {/* ── CHAP PANEL: branding ── */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: '0 0 42%', background: 'linear-gradient(145deg, #0f0069 0%, #1e1b4b 45%, #3525cd 100%)', flexDirection: 'column', justifyContent: 'space-between', p: 6, position: 'relative', overflow: 'hidden' }}>
          {/* Dekorativ doiralar */}
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: '#4f46e5', opacity: 0.15, filter: 'blur(60px)' }} />
          <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', bgcolor: '#712ae2', opacity: 0.12, filter: 'blur(60px)' }} />
          <Box sx={{ position: 'absolute', top: '40%', left: '60%', width: 180, height: 180, borderRadius: '50%', bgcolor: '#c3c0ff', opacity: 0.07, filter: 'blur(40px)' }} />

          {/* Logo */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box sx={{ width: 52, height: 52, borderRadius: 3, flexShrink: 0, background: 'linear-gradient(135deg, #4f46e5 0%, #712ae2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(79,70,229,0.5)' }}>
                <BuFuLogoSvg size={30} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 900, fontSize: 24, lineHeight: 1, letterSpacing: -0.5 }}>
                  <span style={{ color: '#818cf8' }}>Bu</span><span style={{ color: 'white' }}>Fu</span>
                </Typography>
                <Typography sx={{ color: '#818cf8', fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>BUILD FUTURE</Typography>
              </Box>
            </Stack>

            <Typography variant="h4" fontWeight={800} color="white" sx={{ lineHeight: 1.2, mb: 1.5, mt: 5, fontSize: { md: 28, lg: 34 } }}>
              O'zbekistondagi eng yaxshi frilanserlar
            </Typography>
            <Typography color="#94a3b8" fontSize={15} lineHeight={1.8}>
              Frilanserlar bilan bog'laning, ishlar joylashtiring va loyihalaringizni muvaffaqiyatli amalga oshiring.
            </Typography>
          </Box>

          {/* Feature qatorlari */}
          <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
            {FEATURES.map((f) => (
              <Stack key={f.text} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {f.icon}
                </Box>
                <Typography fontSize={14} color="#cbd5e1">{f.text}</Typography>
              </Stack>
            ))}
          </Stack>

          {/* Footer */}
          <Typography fontSize={12} color="#475569" sx={{ position: 'relative', zIndex: 1 }}>
            © 2026 BuFu — Build Future. Barcha huquqlar himoyalangan.
          </Typography>
        </Box>

        {/* ── O'NG PANEL: forma ── */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#faf8ff', p: { xs: 3, md: 5 }, overflowY: 'auto' }}>
          <Box sx={{ width: '100%', maxWidth: 460 }}>

            {/* Mobil logo */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={4} sx={{ display: { md: 'none' } }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, flexShrink: 0, background: 'linear-gradient(135deg, #4f46e5 0%, #712ae2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(79,70,229,0.35)' }}>
                <BuFuLogoSvg size={22} />
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5 }}>
                <span style={{ color: '#3525cd' }}>Bu</span><span style={{ color: '#131b2e' }}>Fu</span>
              </Typography>
            </Stack>

            {/* ── TAB TUGMALARI ── */}
            <Box sx={{ display: 'flex', bgcolor: '#eaedff', borderRadius: 2.5, p: 0.6, mb: 4 }}>
              {(['login', 'signup'] as const).map((tab) => (
                <Box
                  key={tab}
                  onClick={() => { setActiveTab(tab); setErrorMessage(''); setSignupStep(1); }}
                  sx={{
                    flex: 1, textAlign: 'center', py: 1.1, borderRadius: 2, cursor: 'pointer', fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                    bgcolor: activeTab === tab ? 'white' : 'transparent',
                    color: activeTab === tab ? '#131b2e' : '#464555',
                    boxShadow: activeTab === tab ? '0 1px 4px rgba(53,37,205,0.12)' : 'none',
                  }}
                >
                  {tab === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
                </Box>
              ))}
            </Box>

            {/* ── LOGIN PANELI ── */}
            {activeTab === 'login' && (
              <>
                <Box mb={3.5}>
                  <Typography variant="h5" fontWeight={800} color="#131b2e" mb={0.5}>Xush kelibsiz!</Typography>
                  <Typography color="#464555" fontSize={14}>Hisobingizga kiring va davom eting</Typography>
                </Box>

                {/* Telegram bot linki */}
                <Stack spacing={1.5} mb={3}>
                  <a
                    href="https://t.me/buildfuture_bot?start=auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 1.3, px: 2, bgcolor: '#229ED9', borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { bgcolor: '#1a8bbf' }, boxShadow: '0 2px 8px rgba(34,158,217,0.25)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.032 9.569c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.895.652z"/>
                      </svg>
                      <Typography fontWeight={700} fontSize={14} color="white">Telegram orqali kirish</Typography>
                    </Box>
                  </a>

                  {/* Google tugmasi (vizual only) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, py: 1.3, px: 2, bgcolor: 'white', border: '1.5px solid #e2e8f0', borderRadius: 2, cursor: 'not-allowed', opacity: 0.7 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <Typography fontWeight={600} fontSize={14} color="#464555">Google orqali kirish (tez orada)</Typography>
                  </Box>
                </Stack>

                {/* TelegramLoginButton (widget) - agar botName mavjud bo'lsa */}
                {botName && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <TelegramLoginButton botName={botName} onAuth={handleTelegramAuth} buttonSize="medium" cornerRadius={8} />
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: '#e2e8f0' }} />
                  <Typography fontSize={12} color="#777587">yoki foydalanuvchi nomi bilan</Typography>
                  <Box sx={{ flex: 1, height: '1px', bgcolor: '#e2e8f0' }} />
                </Box>

                {errorMessage && <Alert severity="error" sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}>{errorMessage}</Alert>}

                <form onSubmit={handleLoginSubmit}>
                  <Stack spacing={2}>
                    <TextField
                      label="Foydalanuvchi nomi"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      size="small" fullWidth required
                      placeholder="otabek_dev"
                      inputProps={{ autoCapitalize: 'none' }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon size={18} color="#777587" /></InputAdornment> }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                    />
                    <TextField
                      label="Parol"
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      size="small" fullWidth required
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LockOutlinedIcon size={18} color="#777587" /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end" sx={{ color: '#777587' }}>
                              <Typography fontSize={11}>{showPassword ? 'yashir' : 'ko\'r'}</Typography>
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                    />
                    <Button
                      type="submit" variant="contained" fullWidth disabled={isLoading}
                      sx={{ bgcolor: '#3525cd', '&:hover': { bgcolor: '#2a1da8' }, borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(53,37,205,0.3)' }}
                    >
                      {isLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: 'white' }} /><span>Kuting...</span></Stack> : 'Kirish'}
                    </Button>
                  </Stack>
                </form>

                <Typography fontSize={13} color="#464555" textAlign="center" mt={3}>
                  Hisobingiz yo'qmi?{' '}
                  <Box component="span" sx={{ color: '#3525cd', cursor: 'pointer', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }} onClick={() => { setActiveTab('signup'); setErrorMessage(''); }}>
                    Ro'yxatdan o'ting
                  </Box>
                </Typography>
              </>
            )}

            {/* ── SIGNUP PANELI ── */}
            {activeTab === 'signup' && (
              <>
                {/* Progress bar */}
                <Box mb={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography fontWeight={800} fontSize={16} color="#131b2e">
                      {signupStep === 1 ? 'Rolni tanlang' : signupStep === 2 ? "Ma'lumotlarni kiriting" : 'Yakunlash'}
                    </Typography>
                    <Typography fontSize={12} color="#3525cd" fontWeight={700}>
                      {signupStep} / 2 qadam
                    </Typography>
                  </Stack>
                  <Box sx={{ height: 6, bgcolor: '#eaedff', borderRadius: 3, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', bgcolor: '#3525cd', width: `${signupProgress}%`, transition: 'width 0.5s ease', borderRadius: 3 }} />
                  </Box>
                  <Typography fontSize={13} color="#464555" mt={1}>
                    {signupStep === 1 ? "O'z faoliyatingizni boshlash uchun rolni tanlang" : "Profilingizni to'ldiring va hisob oching"}
                  </Typography>
                </Box>

                {errorMessage && <Alert severity="error" sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}>{errorMessage}</Alert>}

                {/* ─── STEP 1: Rol tanlash ─── */}
                {signupStep === 1 && (
                  <Stack spacing={2}>
                    <Stack spacing={1.5}>
                      {[
                        {
                          role: UserType.AGENT,
                          icon: <Briefcase size={32} color={selectedRole === UserType.AGENT ? '#3525cd' : '#464555'} weight="fill" />,
                          title: 'Ish beruvchi',
                          desc: 'Men frilanserlarni yollash va professional loyihalarni amalga oshirishni xohlayman.',
                        },
                        {
                          role: UserType.FREELANCER,
                          icon: <Palette size={32} color={selectedRole === UserType.FREELANCER ? '#3525cd' : '#464555'} weight="fill" />,
                          title: 'Frilanser',
                          desc: "Men o'z xizmatlarimni taklif qilish va loyihalarda ishtirok etish orqali pul topishni xohlayman.",
                        },
                      ].map(({ role, icon, title, desc }) => (
                        <Box
                          key={role}
                          onClick={() => setSelectedRole(role)}
                          sx={{
                            p: 3, border: `2px solid ${selectedRole === role ? '#3525cd' : '#c7c4d8'}`,
                            bgcolor: selectedRole === role ? '#f2f3ff' : 'white',
                            borderRadius: 2.5, cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: selectedRole === role ? '0 0 0 4px rgba(53,37,205,0.1)' : 'none',
                            '&:hover': { borderColor: '#3525cd', bgcolor: '#f2f3ff' },
                          }}
                        >
                          <Stack direction="row" spacing={2.5} alignItems="center">
                            <Box sx={{ width: 64, height: 64, borderRadius: 2.5, bgcolor: selectedRole === role ? '#c3c0ff' : '#eaedff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                              {icon}
                            </Box>
                            <Box flex={1}>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Typography fontWeight={800} fontSize={15} color="#131b2e" mb={0.5}>{title}</Typography>
                                <Box sx={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selectedRole === role ? '#3525cd' : '#c7c4d8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                                  {selectedRole === role && <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3525cd' }} />}
                                </Box>
                              </Stack>
                              <Typography fontSize={13} color="#464555" lineHeight={1.5}>{desc}</Typography>
                            </Box>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>

                    <Button
                      fullWidth variant="contained"
                      disabled={!selectedRole}
                      onClick={handleRoleContinue}
                      endIcon={<ArrowRight size={18} weight="bold" />}
                      sx={{ bgcolor: '#3525cd', '&:hover': { bgcolor: '#2a1da8' }, borderRadius: 2, py: 1.4, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(53,37,205,0.3)', '&:disabled': { bgcolor: '#c7c4d8', color: 'white' } }}
                    >
                      Davom etish
                    </Button>

                    <Typography fontSize={13} color="#464555" textAlign="center">
                      Hisobingiz bormi?{' '}
                      <Box component="span" sx={{ color: '#3525cd', cursor: 'pointer', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }} onClick={() => { setActiveTab('login'); setErrorMessage(''); }}>
                        Kirish
                      </Box>
                    </Typography>
                  </Stack>
                )}

                {/* ─── STEP 2: Ma'lumotlar formasi ─── */}
                {signupStep === 2 && (
                  <form onSubmit={handleSignupSubmit}>
                    <Stack spacing={2}>
                      {/* Profil rasm yuklash */}
                      <Box component="label" sx={{ p: 2, bgcolor: 'white', border: '1.5px dashed #c7c4d8', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: '#3525cd', bgcolor: '#f2f3ff' } }}>
                        <input type="file" accept="image/*" hidden onChange={handleProfileImageChange} />
                        <Avatar src={profileImage || undefined} sx={{ width: 52, height: 52, bgcolor: '#3525cd', color: 'white', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                          {getInitials(fullName, username)}
                        </Avatar>
                        <Box flex={1} minWidth={0}>
                          <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
                            <Camera size={15} color="#3525cd" weight="fill" />
                            <Typography fontSize={13} fontWeight={700} color="#3525cd">{profileImage ? 'Rasm tanlandi' : 'Profil rasmi qo\'shish'}</Typography>
                          </Stack>
                          <Typography fontSize={12} color="#464555">Kamera yoki galereyadan rasm yuklash</Typography>
                          <Typography fontSize={11} color="#777587" mt={0.25}>Rasm bo'lmasa bosh harflar ko'rsatiladi</Typography>
                        </Box>
                        <UploadSimple size={18} color="#777587" />
                      </Box>

                      {/* To'liq ism */}
                      <TextField
                        label="To'liq ism-sharifingiz" value={fullName} onChange={(e) => setFullName(e.target.value)}
                        size="small" fullWidth required placeholder="Masalan: Azizbek Temirov"
                        InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon size={18} color="#777587" /></InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                      />

                      {/* Manzil */}
                      <TextField
                        label="Manzil" value={location} onChange={(e) => setLocation(e.target.value)}
                        size="small" fullWidth required placeholder="Toshkent, UZ"
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                      />

                      {/* Foydalanuvchi nomi */}
                      <TextField
                        label="Foydalanuvchi nomi" value={username} onChange={(e) => setUsername(e.target.value)}
                        size="small" fullWidth required placeholder="azizbek_dev"
                        inputProps={{ autoCapitalize: 'none' }}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon size={18} color="#777587" /></InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                      />

                      {/* Parol */}
                      <TextField
                        label="Parol" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                        size="small" fullWidth required
                        InputProps={{ startAdornment: <InputAdornment position="start"><LockOutlinedIcon size={18} color="#777587" /></InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd', boxShadow: '0 0 0 4px rgba(53,37,205,0.1)' } } }}
                      />

                      {/* Frilanser uchun qo'shimcha maydonlar */}
                      {selectedRole === UserType.FREELANCER && (
                        <>
                          <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2, '&:hover fieldset': { borderColor: '#3525cd' }, '&.Mui-focused fieldset': { borderColor: '#3525cd' } } }}>
                            <InputLabel>Ixtisoslik yo'nalishi</InputLabel>
                            <Select value={freelancerCategory} label="Ixtisoslik yo'nalishi" onChange={(e) => setFreelancerCategory(e.target.value)}>
                              {Object.values(JobCategory).map((cat) => (<MenuItem key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>))}
                            </Select>
                          </FormControl>

                          <TextField
                            label="Soatlik narx (USD)" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)}
                            type="number" size="small" fullWidth placeholder="25"
                            inputProps={{ min: 0, step: 1 }}
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                          />

                          <Stack direction="row" spacing={1}>
                            <TextField
                              label="Ko'nikmalar" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                              size="small" fullWidth placeholder="Figma, React, SMM"
                              sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                            />
                            <Button variant="outlined" onClick={addSkill} sx={{ borderColor: '#c7c4d8', color: '#3525cd', minWidth: 80, fontWeight: 700 }}>Qo'sh</Button>
                          </Stack>
                          {skills.length > 0 && (
                            <Stack direction="row" flexWrap="wrap" gap={1}>
                              {skills.map((skill) => (<Chip key={skill} label={skill} size="small" onDelete={() => removeSkill(skill)} sx={{ bgcolor: '#eaedff', color: '#3525cd', fontWeight: 600 }} />))}
                            </Stack>
                          )}
                        </>
                      )}

                      {/* Bio */}
                      <Box>
                        <TextField
                          label={selectedRole === UserType.FREELANCER ? 'Tajribangiz haqida' : 'Qanday ishchi izlayapsiz?'}
                          value={bio} onChange={(e) => setBio(e.target.value)}
                          size="small" fullWidth multiline minRows={3}
                          placeholder={selectedRole === UserType.FREELANCER ? "Qanday xizmatlar qilasiz, tajribangiz va kuchli tomonlaringiz..." : "Qaysi yo'nalishda mutaxassis kerak, qanday loyihalar bor..."}
                          inputProps={{ maxLength: 500 }}
                          helperText={`${bio.length}/500`}
                          FormHelperTextProps={{ sx: { textAlign: 'right', mr: 0 } }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                      </Box>

                      {/* Tugmalar */}
                      <Stack direction="row" spacing={1.5}>
                        <Button
                          variant="outlined"
                          onClick={() => { setSignupStep(1); setErrorMessage(''); }}
                          startIcon={<ArrowLeft size={16} weight="bold" />}
                          sx={{ borderColor: '#c7c4d8', color: '#464555', borderRadius: 2, py: 1.3, fontWeight: 600, minWidth: 100, '&:hover': { borderColor: '#3525cd', color: '#3525cd', bgcolor: '#f2f3ff' } }}
                        >
                          Orqaga
                        </Button>
                        <Button
                          type="submit" variant="contained" fullWidth disabled={isLoading}
                          endIcon={!isLoading && <CheckCircle size={18} weight="fill" />}
                          sx={{ bgcolor: '#3525cd', '&:hover': { bgcolor: '#2a1da8' }, borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(53,37,205,0.3)' }}
                        >
                          {isLoading ? <Stack direction="row" spacing={1} alignItems="center"><CircularProgress size={16} sx={{ color: 'white' }} /><span>Yaratilmoqda...</span></Stack> : 'Hisob yaratish'}
                        </Button>
                      </Stack>

                      <Typography fontSize={13} color="#464555" textAlign="center">
                        Hisobingiz bormi?{' '}
                        <Box component="span" sx={{ color: '#3525cd', cursor: 'pointer', fontWeight: 700, '&:hover': { textDecoration: 'underline' } }} onClick={() => { setActiveTab('login'); setErrorMessage(''); }}>
                          Kirish
                        </Box>
                      </Typography>
                    </Stack>
                  </form>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AccountPage;
