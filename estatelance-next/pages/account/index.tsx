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
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
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
  { icon: <House size={20} color="#a5b4fc" weight="fill" />, text: "Frilanserlar uchun maxsus platforma" },
  { icon: <Lightning size={20} color="#a5b4fc" weight="fill" />, text: "Tez ish toping yoki frilanser yollang" },
  { icon: <LockOutlinedIcon size={20} color="#a5b4fc" weight="fill" />, text: "Xavfsiz to'lov va shartnomalar" },
  { icon: <Globe size={20} color="#a5b4fc" weight="fill" />, text: "O'zbekiston bo'ylab 100+ mutaxassis" },
];

function getInitials(name: string, fallback = ''): string {
  const source = name.trim() || fallback.trim();
  if (!source) return '';

  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '';
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

const AccountPage = () => {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  // ── Hooklar har doim shart tekshiruvidan OLDIN (React qoidasi) ──────────────
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserType | ''>('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [bio, setBio] = useState('');
  const [freelancerCategory, setFreelancerCategory] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const pendingOnboarding = useRef(false);
  const [updateProfile] = useMutation(UPDATE_PROFILE);

  // Hydration guard + session check:
  // - sessionChecked starts false → server renders nothing (no form), client matches server
  // - After mount, setSessionChecked(true) reveals the form (or redirects if logged in)
  // - This prevents BOTH the hydration mismatch AND the flash of the login form
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
  // Onboarding tugamagan userlarni redirect qilmasdan sahifada ushlab turish
  if (user._id && !user.needsOnboarding) return null;

  const botName = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME ?? '';

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Faqat rasm faylini yuklash mumkin.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Rasm hajmi 2MB dan oshmasin.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProfileImage(String(reader.result));
      setErrorMessage('');
    };
    reader.readAsDataURL(file);
  };

  const handleTabChange = (_: React.SyntheticEvent, val: 'login' | 'signup') => {
    setActiveTab(val);
    setErrorMessage('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      if (activeTab === 'login') {
        await loginWithPassword(username, password);
        router.push('/');
      } else {
        if (!selectedRole) {
          throw new Error('Avval ish izlayotganingizni yoki ishchi izlayotganingizni tanlang.');
        }

        await signupWithPassword(username, password, selectedRole, fullName, location, profileImage);

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
            if (updated.accessToken) {
              saveToken(updated.accessToken);
            }
            userVar({
              ...userVar(),
              fullName: updated.fullName ?? fullName,
              profileImage: updated.profileImage ?? '',
            });
          }
        }

        const newUser = userVar();
        if (selectedRole === UserType.FREELANCER && newUser._id) {
          router.push(`/profile/${newUser._id}`);
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      const message = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Xatolik yuz berdi. Qayta urinib ko\'ring.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

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
      const message = err?.graphQLErrors?.[0]?.message ?? err?.message ?? 'Telegram orqali kirishda xatolik.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingNext = () => {
    if (!onboardingRole) return;
    setSlideDirection('left');
    setOnboardingStep(2);
    setOnboardingPhone('');
  };

  const handleOnboardingBack = () => {
    setSlideDirection('right');
    setOnboardingStep(1);
  };

  const handleOnboardingImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => setOnboardingImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleOnboardingResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return;
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
    if (!onboardingPhone.trim()) {
      setErrorMessage('Telefon raqam kiritish majburiy.');
      return;
    }
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

      // Yangi JWT saqla — needsOnboarding: false bo'lgan token
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

  return (
    <>
      <Head>
        <title>Kirish — BuFu</title>
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

          {/* Progress bar */}
          <Box sx={{ height: 4, bgcolor: '#e2e8f0' }}>
            <Box sx={{
              height: '100%',
              bgcolor: '#4f46e5',
              width: onboardingStep === 1 ? '50%' : '100%',
              transition: 'width 0.4s ease',
            }} />
          </Box>

          {/* Step indicator */}
          <Stack direction="row" justifyContent="center" spacing={1} pt={2.5} px={4}>
            {[1, 2].map((s) => (
              <Box key={s} sx={{
                width: s === onboardingStep ? 24 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor: s <= onboardingStep ? '#4f46e5' : '#e2e8f0',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </Stack>

          {/* Animated steps container */}
          <Box sx={{ position: 'relative', overflow: 'hidden' }}>

            {/* Step 1: Rol tanlash */}
            <Box sx={{
              p: 4, pt: 2.5,
              transform: onboardingStep === 1 ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              position: onboardingStep === 1 ? 'relative' : 'absolute',
              top: 0, left: 0, width: '100%',
            }}>
              <Typography variant="h6" fontWeight={800} color="#0f172a" mb={0.5} textAlign="center">
                Xush kelibsiz!
              </Typography>
              <Typography fontSize={13} color="text.secondary" textAlign="center" mb={3}>
                Siz platformadan nima uchun foydalanasiz?
              </Typography>

              <Stack spacing={1.5} mb={3}>
                {[
                  { role: UserType.FREELANCER, icon: <Palette size={22} color="#4f46e5" weight="fill" />, title: 'Ish izlayapman', desc: 'Profil ochib, ishlarga taklif yuboraman' },
                  { role: UserType.AGENT, icon: <House size={22} color="#4f46e5" weight="fill" />, title: 'Ishchi izlayapman', desc: 'Ish joylayman va mutaxassis yollayman' },
                ].map(({ role, icon, title, desc }) => (
                  <Box
                    key={role}
                    onClick={() => setOnboardingRole(role)}
                    sx={{
                      p: 2,
                      border: `2px solid ${onboardingRole === role ? '#4f46e5' : '#e2e8f0'}`,
                      bgcolor: onboardingRole === role ? '#eef2ff' : 'white',
                      borderRadius: 2.5,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: onboardingRole === role ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: onboardingRole === role ? '0 4px 16px rgba(79,70,229,0.15)' : 'none',
                      '&:hover': { borderColor: '#4f46e5', bgcolor: '#f5f3ff' },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{
                        width: 44, height: 44,
                        bgcolor: onboardingRole === role ? '#c7d2fe' : '#eef2ff',
                        borderRadius: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s',
                      }}>
                        {icon}
                      </Box>
                      <Box>
                        <Typography fontWeight={700} fontSize={14} color="#0f172a">{title}</Typography>
                        <Typography fontSize={12} color="text.secondary">{desc}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="contained"
                disabled={!onboardingRole}
                onClick={handleOnboardingNext}
                sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, py: 1.3, fontWeight: 700 }}
              >
                Keyingisi →
              </Button>
            </Box>

            {/* Step 2: Profil ma'lumotlari */}
            <Box sx={{
              p: 3, pt: 2,
              transform: onboardingStep === 2 ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
              position: onboardingStep === 2 ? 'relative' : 'absolute',
              top: 0, left: 0, width: '100%',
              maxHeight: '70vh',
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: '#e2e8f0', borderRadius: 2 },
            }}>
              <Typography variant="h6" fontWeight={800} color="#0f172a" mb={0.25} textAlign="center">
                Profilingizni to'ldiring
              </Typography>
              <Typography fontSize={12} color="text.secondary" textAlign="center" mb={2.5}>
                Bu ma'lumotlar boshqa foydalanuvchilarga ko'rinadi
              </Typography>

              <Stack spacing={1.75}>
                {/* Profil rasmi */}
                <Box component="label" sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  p: 1.5, border: '1px dashed #cbd5e1', borderRadius: 2, cursor: 'pointer',
                  transition: 'all 0.15s',
                  '&:hover': { borderColor: '#4f46e5', bgcolor: '#f8f7ff' },
                }}>
                  <input type="file" accept="image/*" hidden onChange={handleOnboardingImageChange} />
                  <Avatar src={onboardingImage || undefined} sx={{ width: 48, height: 48, bgcolor: '#4f46e5', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {getInitials(onboardingImage ? '' : (userVar().fullName || userVar().username || ''))}
                  </Avatar>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Camera size={14} color="#4f46e5" weight="fill" />
                      <Typography fontSize={13} fontWeight={700} color="#4f46e5">
                        {onboardingImage ? "Rasm tanlandi" : "Profil rasmi yuklash"}
                      </Typography>
                    </Stack>
                    <Typography fontSize={11} color="#94a3b8">JPG, PNG · max 2MB</Typography>
                  </Box>
                </Box>

                <TextField
                  label="To'liq ism"
                  value={onboardingFullName}
                  onChange={(e) => setOnboardingFullName(e.target.value)}
                  size="small" fullWidth placeholder="Otabek Ikromov"
                  InputProps={{ startAdornment: <InputAdornment position="start"><BadgeOutlinedIcon size={17} color="#94a3b8" /></InputAdornment> }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                />

                <TextField
                  label="Manzil"
                  value={onboardingLocation}
                  onChange={(e) => setOnboardingLocation(e.target.value)}
                  size="small" fullWidth placeholder="Toshkent, UZ"
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                />

                <TextField
                  label="Telefon raqam *"
                  value={onboardingPhone}
                  onChange={(e) => setOnboardingPhone(e.target.value)}
                  size="small" fullWidth placeholder="+998 90 123 45 67"
                  helperText="Oxirgi 4 ta raqam boshqa foydalanuvchilarga ko'rinadi"
                  FormHelperTextProps={{ sx: { fontSize: 11, color: '#94a3b8', mx: 0 } }}
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                />

                {/* Freelancer uchun qo'shimcha fieldlar */}
                {onboardingRole === UserType.FREELANCER && (
                  <>
                    <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}>
                      <InputLabel>Ixtisoslik yo'nalishi</InputLabel>
                      <Select value={onboardingCategory} label="Ixtisoslik yo'nalishi" onChange={(e) => setOnboardingCategory(e.target.value)}>
                        {Object.values(JobCategory).map((cat) => (
                          <MenuItem key={cat} value={cat} sx={{ fontSize: 13 }}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      label="Soatlik narx (USD)"
                      value={onboardingHourlyRate}
                      onChange={(e) => setOnboardingHourlyRate(e.target.value)}
                      type="number" size="small" fullWidth placeholder="25"
                      inputProps={{ min: 0, step: 1 }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                    />

                    <Box>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          label="Ko'nikmalar"
                          value={onboardingSkillInput}
                          onChange={(e) => setOnboardingSkillInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOnboardingSkill(); } }}
                          size="small" fullWidth placeholder="AutoCAD, SMM, 3D rendering"
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                        <Button variant="outlined" onClick={addOnboardingSkill} sx={{ borderColor: '#e2e8f0', color: '#4f46e5', minWidth: 70, fontSize: 12 }}>
                          Qo'sh
                        </Button>
                      </Stack>
                      {onboardingSkills.length > 0 && (
                        <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
                          {onboardingSkills.map((skill) => (
                            <Chip key={skill} label={skill} size="small" onDelete={() => setOnboardingSkills((p) => p.filter((s) => s !== skill))} />
                          ))}
                        </Stack>
                      )}
                    </Box>

                    {/* Resume yuklash */}
                    <Box component="label" sx={{
                      display: 'flex', alignItems: 'center', gap: 2,
                      p: 1.5, border: `1px dashed ${onboardingResumeFile ? '#16a34a' : '#cbd5e1'}`,
                      bgcolor: onboardingResumeFile ? '#f0fdf4' : 'white',
                      borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                      '&:hover': { borderColor: '#4f46e5', bgcolor: '#f8f7ff' },
                    }}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        hidden
                        onChange={handleOnboardingResumeChange}
                      />
                      <Box sx={{
                        width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
                        bgcolor: onboardingResumeFile ? '#dcfce7' : '#f1f5f9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <UploadSimple size={18} color={onboardingResumeFile ? '#16a34a' : '#94a3b8'} weight="bold" />
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Typography fontSize={13} fontWeight={700} color={onboardingResumeFile ? '#16a34a' : '#475569'}>
                          {onboardingResumeFile ? onboardingResumeFile.name : 'Resume yuklash (ixtiyoriy)'}
                        </Typography>
                        <Typography fontSize={11} color="#94a3b8">
                          {onboardingResumeFile
                            ? `${(onboardingResumeFile.size / 1024).toFixed(0)} KB`
                            : 'PDF, DOC, DOCX · max 10MB'}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}

                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                    <Typography fontSize={12} color="#64748b">
                      {onboardingRole === UserType.FREELANCER ? 'Tajribangiz haqida' : 'Qanday ishchi izlayapsiz?'}
                    </Typography>
                  </Stack>
                  <TextField
                    value={onboardingBio}
                    onChange={(e) => setOnboardingBio(e.target.value)}
                    size="small" fullWidth multiline rows={3}
                    placeholder={onboardingRole === UserType.FREELANCER ? 'Qanday xizmatlar qilasiz, tajribangiz...' : "Qaysi yo'nalishda mutaxassis kerak..."}
                    sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                  />
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} mt={2.5}>
                <Button
                  variant="outlined"
                  onClick={handleOnboardingBack}
                  sx={{ borderColor: '#e2e8f0', color: '#64748b', borderRadius: 2, py: 1.2, fontWeight: 600, minWidth: 80 }}
                >
                  ← Orqaga
                </Button>
                <Button
                  fullWidth variant="contained"
                  disabled={onboardingLoading}
                  onClick={handleOnboardingSubmit}
                  sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, py: 1.2, fontWeight: 700 }}
                >
                  {onboardingLoading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                      <span>Saqlanmoqda...</span>
                    </Stack>
                  ) : 'Boshlash'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Box sx={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
        <IconButton
          aria-label="Asosiy sahifaga qaytish"
          onClick={() => router.push('/')}
          sx={{
            position: 'absolute',
            top: { xs: 16, md: 24 },
            right: { xs: 16, md: 24 },
            zIndex: 5,
            width: 42,
            height: 42,
            bgcolor: 'white',
            color: '#4f46e5',
            border: '1px solid #e2e8f0',
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
            '&:hover': { bgcolor: '#eef2ff', borderColor: '#c7d2fe' },
          }}
        >
          <HouseLine size={21} weight="fill" />
        </IconButton>

        {/* ── Chap panel: branding ── */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flex: '0 0 45%',
            background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 6,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Fon sferalari */}
          <Box sx={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', bgcolor: '#4f46e5', opacity: 0.12, filter: 'blur(60px)' }} />
          <Box sx={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', bgcolor: '#7c3aed', opacity: 0.1, filter: 'blur(60px)' }} />

          {/* Logo */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
              <Box sx={{
                width: 48, height: 48, borderRadius: 2.5, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(99,102,241,0.45)',
              }}>
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="10" height="22" rx="2" fill="white"/>
                  <rect x="13" y="5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="13" y="13" width="7" height="4" rx="2" fill="white"/>
                  <rect x="13" y="22.5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="19" y="5" width="4" height="22" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="5" width="10" height="4.5" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="13" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1, letterSpacing: -0.5 }}>
                  <span style={{ color: '#818cf8' }}>Bu</span><span style={{ color: 'white' }}>Fu</span>
                </Typography>
                <Typography sx={{ color: '#818cf8', fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>Build Future</Typography>
              </Box>
            </Stack>

            <Typography variant="h4" fontWeight={800} color="white" sx={{ lineHeight: 1.25, mb: 1.5, mt: 4 }}>
              O'zbekistondagi eng yaxshi frilanserlar
            </Typography>
            <Typography color="#94a3b8" fontSize={15} lineHeight={1.7}>
              Frilanserlar bilan bog'laning, ishlar joylashtiring va loyihalaringizni muvaffaqiyatli amalga oshiring.
            </Typography>
          </Box>

          {/* Feature qatorlari */}
          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            {FEATURES.map((f) => (
              <Stack key={f.text} direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

        {/* ── O'ng panel: forma ── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#f8fafc',
            p: { xs: 3, md: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 420 }}>

            {/* Mobil logo */}
            <Stack direction="row" alignItems="center" spacing={1.5} mb={4} sx={{ display: { md: 'none' } }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(99,102,241,0.35)',
              }}>
                <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="5" width="10" height="22" rx="2" fill="white"/>
                  <rect x="13" y="5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="13" y="13" width="7" height="4" rx="2" fill="white"/>
                  <rect x="13" y="22.5" width="8" height="4.5" rx="2" fill="white"/>
                  <rect x="19" y="5" width="4" height="22" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="5" width="10" height="4.5" rx="2" fill="rgba(255,255,255,0.5)"/>
                  <rect x="19" y="13" width="8" height="4" rx="2" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: 18, letterSpacing: -0.5 }}>
                <span style={{ color: '#6366f1' }}>Bu</span><span style={{ color: '#1e1b4b' }}>Fu</span>
              </Typography>
            </Stack>

            {/* Sarlavha */}
            <Box mb={4}>
              <Typography variant="h5" fontWeight={800} color="#0f172a" mb={0.5}>
                {activeTab === 'login' ? 'Xush kelibsiz!' : 'Hisob yarating'}
              </Typography>
              <Typography color="text.secondary" fontSize={14}>
                {activeTab === 'login'
                  ? 'Hisobingizga kiring va davom eting'
                  : 'Platformamizga qo\'shiling va ishlashni boshlang'}
              </Typography>
            </Box>

            {/* Tablar */}
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                mb: 3,
                bgcolor: '#e2e8f0',
                borderRadius: 2,
                p: 0.5,
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTab-root': {
                  borderRadius: 1.5,
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#64748b',
                  minHeight: 36,
                  '&.Mui-selected': { bgcolor: 'white', color: '#0f172a', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
                },
              }}
            >
              <Tab label="Kirish" value="login" />
              <Tab label="Ro'yxatdan o'tish" value="signup" />
            </Tabs>

            {/* Telegram */}
            {botName && (
              <>
                <Stack spacing={1.5} mb={3}>
                  <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
                    Telegram orqali tez kirish (parol talab qilinmaydi)
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <TelegramLoginButton botName={botName} onAuth={handleTelegramAuth} buttonSize="large" cornerRadius={8} />
                  </Box>
                </Stack>
                <Divider sx={{ my: 2.5 }}>
                  <Typography variant="caption" color="text.secondary">yoki foydalanuvchi nomi bilan</Typography>
                </Divider>
              </>
            )}

            {/* Xato xabari */}
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}>
                {errorMessage}
              </Alert>
            )}

            {/* Forma */}
            <form onSubmit={handleFormSubmit}>
              <Stack spacing={2}>
                {activeTab === 'signup' && (
                  <Box>
                    <Typography fontSize={14} fontWeight={800} color="#0f172a" mb={1}>
                      Siz platformadan nima uchun foydalanasiz?
                    </Typography>
                    <ToggleButtonGroup
                      value={selectedRole}
                      exclusive
                      onChange={(_, val) => val && setSelectedRole(val)}
                      fullWidth
                      sx={{ gap: 1, '& .MuiToggleButtonGroup-grouped': { border: '1px solid #e2e8f0 !important' } }}
                    >
                      <ToggleButton
                        value={UserType.FREELANCER}
                        sx={{
                          flex: 1, p: 1.5, textTransform: 'none', borderRadius: '12px !important',
                          bgcolor: 'white', alignItems: 'flex-start', justifyContent: 'flex-start',
                          '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe !important' },
                        }}
                      >
                        <Stack alignItems="flex-start" spacing={0.5}>
                          <Palette size={20} />
                          <Typography fontSize={13} fontWeight={800}>Ish izlayapman</Typography>
                          <Typography fontSize={11} color="text.secondary" textAlign="left">
                            Profil ochib, ishlarga taklif yuboraman
                          </Typography>
                        </Stack>
                      </ToggleButton>
                      <ToggleButton
                        value={UserType.AGENT}
                        sx={{
                          flex: 1, p: 1.5, textTransform: 'none', borderRadius: '12px !important',
                          bgcolor: 'white', alignItems: 'flex-start', justifyContent: 'flex-start',
                          '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe !important' },
                        }}
                      >
                        <Stack alignItems="flex-start" spacing={0.5}>
                          <House size={20} />
                          <Typography fontSize={13} fontWeight={800}>Ishchi izlayapman</Typography>
                          <Typography fontSize={11} color="text.secondary" textAlign="left">
                            Ish joylayman va mutaxassis yollayman
                          </Typography>
                        </Stack>
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                )}

                {(activeTab === 'login' || selectedRole) && (
                  <>
                    {activeTab === 'signup' && (
                      <>
                        <TextField
                          label="To'liq ism"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          size="small"
                          fullWidth
                          required
                          placeholder="Otabek Ikromov"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BadgeOutlinedIcon size={20} color="#94a3b8" />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />

                        <Box
                          component="label"
                          sx={{
                            p: 2,
                            bgcolor: 'white',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: '#4f46e5', bgcolor: '#f8f7ff' },
                          }}
                        >
                          <input type="file" accept="image/*" hidden onChange={handleProfileImageChange} />
                          <Avatar
                            src={profileImage || undefined}
                            sx={{
                              width: 56,
                              height: 56,
                              bgcolor: '#4f46e5',
                              color: 'white',
                              fontSize: 18,
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {getInitials(fullName, username)}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Stack direction="row" alignItems="center" spacing={0.75} mb={0.25}>
                              <Camera size={17} color="#4f46e5" weight="fill" />
                              <Typography fontSize={13} fontWeight={800} color="#0f172a">
                                Profil rasmi qo'shish
                              </Typography>
                            </Stack>
                            <Typography fontSize={12} color="#64748b">
                              Kamera yoki galereyadan rasm yuklash
                            </Typography>
                            <Typography fontSize={11} color="#94a3b8" mt={0.25}>
                              Rasm bo'lmasa bosh harflar ko'rsatiladi
                            </Typography>
                          </Box>
                          <UploadSimple size={20} color="#94a3b8" />
                        </Box>

                        <TextField
                          label="Manzil"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          size="small"
                          fullWidth
                          required
                          placeholder="Toshkent, UZ"
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                      </>
                    )}

                    <TextField
                      label="Foydalanuvchi nomi"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      size="small"
                      fullWidth
                      required
                      placeholder="otabek_realtor"
                      inputProps={{ autoCapitalize: 'none' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlineIcon size={20} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                    />

                    <TextField
                      label="Parol"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      size="small"
                      fullWidth
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOutlinedIcon size={20} color="#94a3b8" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                    />

                    {activeTab === 'signup' && selectedRole === UserType.FREELANCER && (
                      <>
                        <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}>
                          <InputLabel>Ixtisoslik yo'nalishi</InputLabel>
                          <Select
                            value={freelancerCategory}
                            label="Ixtisoslik yo'nalishi"
                            onChange={(e) => setFreelancerCategory(e.target.value)}
                          >
                            {Object.values(JobCategory).map((cat) => (
                              <MenuItem key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          label="Soatlik narx (USD)"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          type="number"
                          size="small"
                          fullWidth
                          placeholder="25"
                          inputProps={{ min: 0, step: 1 }}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />

                        <Stack direction="row" spacing={1}>
                          <TextField
                            label="Ko'nikmalar"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                            size="small"
                            fullWidth
                            placeholder="AutoCAD, SMM, 3D rendering"
                            sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                          />
                          <Button variant="outlined" onClick={addSkill} sx={{ borderColor: '#e2e8f0', color: '#4f46e5' }}>
                            Qo'shish
                          </Button>
                        </Stack>
                        {skills.length > 0 && (
                          <Stack direction="row" flexWrap="wrap" gap={1}>
                            {skills.map((skill) => (
                              <Chip key={skill} label={skill} size="small" onDelete={() => removeSkill(skill)} />
                            ))}
                          </Stack>
                        )}
                      </>
                    )}

                    {activeTab === 'signup' && (
                      <Box>
                        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                          <Typography fontSize={12} color="#64748b">
                            {selectedRole === UserType.FREELANCER ? 'Tajribangiz haqida' : 'Qanday ishchi izlayapsiz?'}
                          </Typography>
                        </Stack>
                        <TextField
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          size="small"
                          fullWidth
                          multiline
                          minRows={3}
                          placeholder={
                            selectedRole === UserType.FREELANCER
                              ? 'Qanday xizmatlar qilasiz, tajribangiz va kuchli tomonlaringiz...'
                              : "Qaysi yo'nalishda mutaxassis kerak, qanday loyihalar bor..."
                          }
                          inputProps={{ maxLength: 500 }}
                          helperText={`${bio.length}/500`}
                          sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } }}
                        />
                      </Box>
                    )}
                  </>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading || (activeTab === 'signup' && !selectedRole)}
                  sx={{
                    bgcolor: '#4f46e5',
                    '&:hover': { bgcolor: '#4338ca' },
                    borderRadius: 2,
                    py: 1.3,
                    fontWeight: 700,
                    fontSize: 14,
                    mt: 0.5,
                  }}
                >
                  {isLoading ? (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                      <span>Kuting...</span>
                    </Stack>
                  ) : activeTab === 'login' ? 'Kirish' : selectedRole ? 'Hisob yaratish' : 'Avval tanlang'}
                </Button>
              </Stack>
            </form>

            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={3}>
              {activeTab === 'login' ? (
                <>
                  Hisobingiz yo'qmi?{' '}
                  <Box component="span" sx={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 700 }} onClick={() => setActiveTab('signup')}>
                    Ro'yxatdan o'ting
                  </Box>
                </>
              ) : (
                <>
                  Hisobingiz bormi?{' '}
                  <Box component="span" sx={{ color: '#4f46e5', cursor: 'pointer', fontWeight: 700 }} onClick={() => setActiveTab('login')}>
                    Kirish
                  </Box>
                </>
              )}
            </Typography>

          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AccountPage;
