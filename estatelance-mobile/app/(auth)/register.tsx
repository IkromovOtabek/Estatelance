import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { SIGNUP } from '../../apollo/mutations';

type Role = 'AGENT' | 'FREELANCER' | '';
type Step = 1 | 2 | 3 | 4;

const EXPERIENCE_LEVELS = ['JUNIOR', 'MIDDLE', 'SENIOR'];
const EXP_LABELS: Record<string, string> = {
  JUNIOR: 'Junior (0–2 yil)',
  MIDDLE: 'Middle (2–5 yil)',
  SENIOR: 'Senior (5+ yil)',
};

// ─── Mutaxassislikga qarab ko'nikmalar ────────────────────────────────────────
const SKILLS_BY_PROFESSION: Record<string, string[]> = {
  default:         ['Microsoft Office', 'Muloqot', 'Vaqtni boshqarish', 'Jamoaviy ish', 'Muammoni hal qilish'],
  foto:            ['Lightroom', 'Photoshop', 'Camera RAW', 'Kompozitsiya', 'Studio Aparat', 'Retouching', 'Drone'],
  '3d':            ['3ds Max', 'AutoCAD', 'Revit', 'SketchUp', 'V-Ray', 'Lumion', 'Blender', 'Corona Renderer'],
  dizayn:          ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'UI/UX', 'Branding', 'Motion Graphics'],
  dastur:          ['JavaScript', 'React', 'Node.js', 'Python', 'Flutter', 'TypeScript', 'SQL', 'Git'],
  smm:             ['Instagram', 'TikTok', 'Telegram', 'Content Creation', 'Copywriting', 'Canva', 'Analytics'],
  yuridik:         ['Shartnoma', "Mulk huquqi", "Notariat", "Sud", "Soliq huquqi", "Litsenziyalash"],
  tamirlash:       ["Elektr", "Santexnika", "Bo'yash", "Gips", "Kafel", "Parket", "Konditsioner"],
  tozalash:        ["Uy tozalash", "Ofis tozalash", "Deraza tozalash", "Kimyoviy tozalash", "Bug' bilan tozalash"],
  baholash:        ["Ko'chmas mulk baholash", "Bozor tahlili", "Hujjatlashtirish", "Ekspertiza"],
  marketing:       ['SEO', 'Google Ads', 'Email Marketing', 'Analytics', 'Copywriting', 'CRM'],
  video:           ['Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Motion Graphics', 'Color Grading'],
};

function getSkillsByProfession(profession: string): string[] {
  const p = profession.toLowerCase();
  if (p.includes('foto') || p.includes('photo') || p.includes('dron'))          return SKILLS_BY_PROFESSION.foto;
  if (p.includes('3d') || p.includes('render') || p.includes('vizual'))         return SKILLS_BY_PROFESSION['3d'];
  if (p.includes('dizayn') || p.includes('design') || p.includes('ui'))         return SKILLS_BY_PROFESSION.dizayn;
  if (p.includes('dastur') || p.includes('developer') || p.includes('flutter')) return SKILLS_BY_PROFESSION.dastur;
  if (p.includes('smm') || p.includes('marketing') || p.includes('content'))    return SKILLS_BY_PROFESSION.smm;
  if (p.includes('yuridik') || p.includes('lawyer') || p.includes('huquq'))     return SKILLS_BY_PROFESSION.yuridik;
  if (p.includes('tamir') || p.includes('repair') || p.includes('quril'))       return SKILLS_BY_PROFESSION.tamirlash;
  if (p.includes('tozal') || p.includes('clean'))                                return SKILLS_BY_PROFESSION.tozalash;
  if (p.includes('bahol') || p.includes('valuat') || p.includes('ekspert'))     return SKILLS_BY_PROFESSION.baholash;
  if (p.includes('video') || p.includes('montaj') || p.includes('film'))        return SKILLS_BY_PROFESSION.video;
  return SKILLS_BY_PROFESSION.default;
}

const INDUSTRIES = ['IT & Texnologiya', 'Marketing', 'Dizayn', 'Moliya', "Ta'lim", 'Boshqa'];

const POPULAR_SKILLS = [
  'JavaScript', 'React', 'Node.js', 'Python', 'Figma', 'UI/UX',
  'AutoCAD', '3ds Max', 'SMM', 'Copywriting', 'Video Montaj', 'Flutter',
];

const PROGRESS = { 1: '25%', 2: '50%', 3: '75%', 4: '100%' };

export default function RegisterScreen() {
  const { login } = useAuth();
  const [step, setStep]   = useState<Step>(1);
  const [role, setRole]   = useState<Role>('');
  const [error, setError] = useState('');

  // Step 2
  const [fullName, setFullName]           = useState('');
  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [phone, setPhone]                 = useState('');
  const [profession, setProfession]       = useState('');
  const [experience, setExperience]       = useState('');
  const [company, setCompany]             = useState('');
  const [industry, setIndustry]           = useState('');
  const [profileImage, setProfileImage]   = useState('');
  const [imgLoading, setImgLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);

  // Step 3
  const [skills, setSkills]         = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio]               = useState('');
  const [agreed, setAgreed]         = useState(false);
  const [resumeUrl, setResumeUrl]   = useState('');
  const [resumeName, setResumeName] = useState('');
  const [resumeLoading, setResumeLoading] = useState(false);

  // Mutaxassislikka qarab ko'nikmalar
  const suggestedSkills = useMemo(() => getSkillsByProfession(profession), [profession]);

  const [signup, { loading }] = useMutation(SIGNUP);

  // ─── Profil rasm yuklash ────────────────────────────────────────────────────
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Ruxsat kerak', 'Galereya ruxsatini bering'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setImgLoading(true);
    try {
      const res  = await fetch('https://bufu.uz/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          base64:   `data:image/jpeg;base64,${asset.base64}`,
          fileName: `avatar_${Date.now()}.jpg`,
        }),
      });
      const json = await res.json();
      if (json.url) setProfileImage(`https://bufu.uz${json.url}`);
      else Alert.alert('Xato', "Rasm yuklanmadi");
    } catch {
      Alert.alert('Xato', "Rasm yuklanmadi");
    } finally {
      setImgLoading(false);
    }
  };

  // ─── PDF Resume yuklash ─────────────────────────────────────────────────────
  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Xato', 'Fayl hajmi 5MB dan oshmasligi kerak');
        return;
      }

      setResumeLoading(true);
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64' as any,
      });

      const res  = await fetch('https://bufu.uz/api/upload', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          base64:   `data:application/pdf;base64,${base64}`,
          fileName: file.name,
        }),
      });
      const json = await res.json();
      if (json.url) {
        setResumeUrl(`https://bufu.uz${json.url}`);
        setResumeName(file.name);
      } else {
        Alert.alert('Xato', "Fayl yuklanmadi. Qayta urinib ko'ring.");
      }
    } catch {
      Alert.alert('Xato', "Fayl yuklashda xatolik yuz berdi.");
    } finally {
      setResumeLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pass);
    setShowPass(true);
  };

  // ─── Nav ────────────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!role) { Alert.alert('', 'Iltimos, rolingizni tanlang'); return; }
    }
    if (step === 2) {
      if (!fullName.trim()) { setError("Ism-familiya kiriting"); return; }
      if (!username.trim() || username.trim().length < 3) { setError("Username kamida 3 ta belgi"); return; }
      if (!password || password.length < 6) { setError("Parol kamida 6 ta belgi"); return; }
      if (!phone.trim()) { setError("Telefon raqam kiriting"); return; }
    }
    setError('');
    setStep(s => (s + 1) as Step);
  };

  const toggleSkill = (s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) { setSkills(prev => [...prev, s]); }
    setSkillInput('');
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!agreed) { Alert.alert('', "Foydalanish shartlariga rozilik bildiring"); return; }
    try {
      const { data } = await signup({
        variables: { input: {
          username: username.trim(),
          fullName: fullName.trim(),
          password,
          userType: role,
          ...(bio.trim()      ? { bio: bio.trim() }       : {}),
          ...(skills.length   ? { skills }              : {}),
          ...(resumeUrl       ? { resumeUrl }           : {}),
          ...(phone.trim()    ? { phoneNumber: phone.trim() } : {}),
          ...(profileImage    ? { profileImage }        : {}),
        }},
      });
      await login(data.signup);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi';
      setError(msg.includes('already') || msg.includes('duplicate')
        ? 'Bu username band. Boshqa nom tanlang.'
        : msg
      );
    }
  };

  // ─── Header ─────────────────────────────────────────────────────────────────
  const stepProgress = parseInt(PROGRESS[step]) / 100;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => step === 1 ? router.back() : setStep(s => (s - 1) as Step)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Image source={require('../../assets/bufu-logo.png')} style={styles.topLogo} resizeMode="cover" />
        <Text style={styles.stepLabel}>
          {step === 1 ? "Rol tanlash" : step === 2 ? "Ma'lumotlar" : step === 3 ? "Ko'nikmalar" : "Profil ko'rinishi"}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${stepProgress * 100}%` as any }]} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ══ STEP 1: Rol tanlash ══ */}
          {step === 1 && (
            <View>
              <Text style={styles.heading}>Ro'yxatdan o'tish</Text>
              <Text style={styles.subheading}>O'z faoliyatingizni boshlash uchun rolni tanlang</Text>

              <View style={styles.roleRow}>
                {([
                  {
                    value: 'AGENT' as Role,
                    icon: 'business-outline',
                    title: 'Ish beruvchi',
                    desc: 'Frilanserlarni topib, loyihalarim uchun mutaxassislar yollayman',
                  },
                  {
                    value: 'FREELANCER' as Role,
                    icon: 'briefcase-outline',
                    title: 'Frilanser',
                    desc: "Ko'nikmalarimni taklif qilib, turli loyihalarda ishlayman",
                  },
                ]).map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.roleCard, role === opt.value && styles.roleCardActive]}
                    onPress={() => setRole(opt.value)}
                    activeOpacity={0.8}
                  >
                    {role === opt.value && (
                      <View style={styles.roleCheck}>
                        <Ionicons name="checkmark" size={12} color="white" />
                      </View>
                    )}
                    <View style={[styles.roleIconWrap, role === opt.value && styles.roleIconWrapActive]}>
                      <Ionicons name={opt.icon as any} size={28} color={role === opt.value ? Colors.primary : Colors.textSub} />
                    </View>
                    <Text style={[styles.roleTitle, role === opt.value && { color: Colors.primary }]}>{opt.title}</Text>
                    <Text style={styles.roleDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.nextBtn, !role && styles.nextBtnDisabled]} onPress={handleNext} disabled={!role}>
                <Text style={styles.nextBtnText}>Davom etish</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
                <Text style={styles.loginLinkText}>Allaqachon hisobim bor? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Kirish</Text></Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 2: Ma'lumotlar ══ */}
          {step === 2 && (
            <View>
              <Text style={styles.stepMeta}>Bosqich 2 dan 4</Text>
              <Text style={styles.heading}>
                {role === 'FREELANCER' ? 'Frilanser profili' : "Profil ma'lumotlari"}
              </Text>
              <Text style={styles.subheading}>
                {role === 'FREELANCER'
                  ? "Mijozlar sizni yaxshiroq tanishi uchun asosiy ma'lumotlarni kiriting"
                  : "Loyihalaringizni boshlash uchun quyidagi ma'lumotlarni to'ldiring"}
              </Text>

              {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={15} color="#dc2626" /><Text style={styles.errorText}>{error}</Text></View> : null}

              {/* ── Profil rasm ── */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarPicker} onPress={pickImage} disabled={imgLoading} activeOpacity={0.8}>
                  {imgLoading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person-outline" size={32} color={Colors.textMuted} />
                    </View>
                  )}
                  <View style={styles.avatarCameraBadge}>
                    <Ionicons name="camera" size={14} color="white" />
                  </View>
                </TouchableOpacity>
                <View>
                  <Text style={styles.avatarLabel}>Profil rasmi</Text>
                  <Text style={styles.avatarSub}>(ixtiyoriy)</Text>
                </View>
              </View>

              <Field label="To'liq ism *" icon="person-outline">
                <TextInput style={styles.input} placeholder="Masalan: Azizbek Toshmatov" placeholderTextColor={Colors.textMuted} value={fullName} onChangeText={setFullName} />
              </Field>

              {role === 'FREELANCER' && (
                <Field label="Mutaxassislik" icon="briefcase-outline">
                  <TextInput style={styles.input} placeholder="Masalan: Grafik dizayner" placeholderTextColor={Colors.textMuted} value={profession} onChangeText={setProfession} />
                </Field>
              )}

              {role === 'FREELANCER' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Tajriba darajasi</Text>
                  <View style={styles.expRow}>
                    {EXPERIENCE_LEVELS.map(e => (
                      <TouchableOpacity
                        key={e}
                        style={[styles.expBtn, experience === e && styles.expBtnActive]}
                        onPress={() => setExperience(e)}
                      >
                        <Text style={[styles.expBtnText, experience === e && { color: Colors.primary }]}>
                          {EXP_LABELS[e]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <Field label="Username *" icon="at-outline">
                <TextInput style={styles.input} placeholder="foydalanuvchi_nomi" placeholderTextColor={Colors.textMuted} value={username} onChangeText={t => setUsername(t.replace(/\s/g, ''))} autoCapitalize="none" autoCorrect={false} />
              </Field>

              <Field label="Telefon raqam *" icon="call-outline">
                <TextInput style={styles.input} placeholder="+998 90 123 45 67" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              </Field>

              <View style={styles.fieldWrap}>
                <View style={styles.fieldLabelRow}>
                  <Ionicons name="lock-closed-outline" size={13} color={Colors.textSub} />
                  <Text style={styles.fieldLabel}>Parol * (kamida 6 belgi)</Text>
                </View>
                <View style={styles.passWrap}>
                  <TextInput
                    style={styles.passInput}
                    placeholder="••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                  />
                  <TouchableOpacity style={styles.passIconBtn} onPress={() => setShowPass(v => !v)}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={19} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <View style={styles.passDivider} />
                  <TouchableOpacity style={styles.passIconBtn} onPress={generatePassword}>
                    <Ionicons name="shuffle-outline" size={19} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passHint}>
                  <Ionicons name="information-circle-outline" size={11} color={Colors.textMuted} /> Tasodifiy parol yaratish uchun{' '}
                  <Ionicons name="shuffle-outline" size={11} color={Colors.primary} /> tugmasini bosing
                </Text>
              </View>

              {role === 'AGENT' && (
                <Field label="Kompaniya nomi (ixtiyoriy)" icon="business-outline">
                  <TextInput style={styles.input} placeholder="Kompaniya nomi bo'lsa" placeholderTextColor={Colors.textMuted} value={company} onChangeText={setCompany} />
                </Field>
              )}

              {role === 'AGENT' && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>Faoliyat yo'nalishi</Text>
                  <View style={styles.chipWrap}>
                    {INDUSTRIES.map(ind => (
                      <TouchableOpacity key={ind} style={[styles.chip, industry === ind && styles.chipActive]} onPress={() => setIndustry(ind)}>
                        <Text style={[styles.chipText, industry === ind && { color: 'white' }]}>{ind}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Davom etish</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 3: Ko'nikmalar va bio ══ */}
          {step === 3 && (
            <View>
              <Text style={styles.stepMeta}>Bosqich 3 dan 4</Text>
              <Text style={styles.heading}>
                {role === 'FREELANCER' ? "Ko'nikmalar" : "Deyarli tayyor!"}
              </Text>
              <Text style={styles.subheading}>
                {role === 'FREELANCER'
                  ? "Qaysi ko'nikmalarga egasiz? (ixtiyoriy)"
                  : "Profilingizni to'ldirib, platformani ishlatishni boshlang"}
              </Text>

              {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={15} color="#dc2626" /><Text style={styles.errorText}>{error}</Text></View> : null}

              {role === 'FREELANCER' && (
                <View style={styles.fieldWrap}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="star-outline" size={13} color={Colors.textSub} />
                    <Text style={styles.fieldLabel}>
                      {profession
                        ? `"${profession}" uchun mashhur ko'nikmalar`
                        : "Ko'nikmalar"}
                    </Text>
                  </View>
                  <View style={styles.chipWrap}>
                    {suggestedSkills.map(s => (
                      <TouchableOpacity key={s} style={[styles.chip, skills.includes(s) && styles.chipActive]} onPress={() => toggleSkill(s)}>
                        {skills.includes(s) && <Ionicons name="checkmark" size={11} color="white" style={{ marginRight: 3 }} />}
                        <Text style={[styles.chipText, skills.includes(s) && { color: 'white' }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.skillInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      placeholder="O'z ko'nikmangi qo'shing..."
                      placeholderTextColor={Colors.textMuted}
                      value={skillInput}
                      onChangeText={setSkillInput}
                      onSubmitEditing={addSkill}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>

                  {skills.length > 0 && (
                    <View style={[styles.chipWrap, { marginTop: 8 }]}>
                      {skills.map(s => (
                        <TouchableOpacity key={s} style={[styles.chip, styles.chipActive]} onPress={() => toggleSkill(s)}>
                          <Text style={[styles.chipText, { color: 'white' }]}>{s}</Text>
                          <Ionicons name="close" size={11} color="white" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Field label="O'zingiz haqingizda (ixtiyoriy)" icon="document-text-outline">
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Qisqacha o'zingiz haqingizda yozing..."
                  placeholderTextColor={Colors.textMuted}
                  value={bio} onChangeText={setBio}
                  multiline numberOfLines={4}
                />
              </Field>

              {/* ── PDF Resume ── */}
              {role === 'FREELANCER' && (
                <View style={styles.fieldWrap}>
                  <View style={styles.fieldLabelRow}>
                    <Ionicons name="attach-outline" size={13} color={Colors.textSub} />
                    <Text style={styles.fieldLabel}>Resume / CV (ixtiyoriy, PDF)</Text>
                  </View>

                  {resumeUrl ? (
                    <View style={styles.resumeCard}>
                      <View style={styles.resumeIconWrap}>
                        <Ionicons name="document-text" size={22} color="#dc2626" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.resumeName} numberOfLines={1}>{resumeName}</Text>
                        <Text style={styles.resumeUploaded}>Muvaffaqiyatli yuklandi</Text>
                      </View>
                      <TouchableOpacity onPress={() => { setResumeUrl(''); setResumeName(''); }}>
                        <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.resumeUploadBtn, resumeLoading && { opacity: 0.7 }]}
                      onPress={pickResume}
                      disabled={resumeLoading}
                      activeOpacity={0.8}
                    >
                      {resumeLoading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={22} color={Colors.primary} />
                      )}
                      <View>
                        <Text style={styles.resumeUploadTitle}>
                          {resumeLoading ? 'Yuklanmoqda...' : 'PDF fayl yuklash'}
                        </Text>
                        <Text style={styles.resumeUploadSub}>Maksimal hajm: 5MB</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Ionicons name="eye-outline" size={18} color="white" />
                <Text style={styles.nextBtnText}>Profilni ko'rish</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ══ STEP 4: Profil ko'rinishi ══ */}
          {step === 4 && (
            <View>
              <Text style={styles.stepMeta}>Bosqich 4 dan 4</Text>
              <Text style={styles.heading}>Profilingiz tayyor!</Text>
              <Text style={styles.subheading}>Ro'yxatdan o'tishdan oldin profilingizni ko'rib chiqing</Text>

              {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={15} color="#dc2626" /><Text style={styles.errorText}>{error}</Text></View> : null}

              {/* ── Profil kartasi ── */}
              <View style={styles.previewCard}>
                {/* Cover */}
                <View style={styles.previewCover} />

                {/* Avatar */}
                <View style={styles.previewAvatarWrap}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={styles.previewAvatar} />
                  ) : (
                    <View style={styles.previewAvatarFallback}>
                      <Text style={styles.previewAvatarText}>
                        {(fullName || username || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.previewAvailDot, { backgroundColor: '#22c55e' }]} />
                </View>

                {/* Info */}
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{fullName || username}</Text>
                  <Text style={styles.previewUsername}>@{username}</Text>
                  {profession ? <Text style={styles.previewProfession}>{profession}</Text> : null}

                  {/* Role badge */}
                  <View style={[styles.previewRoleBadge, role === 'AGENT' ? styles.agentBg : styles.freelancerBg]}>
                    <Ionicons
                      name={role === 'AGENT' ? 'business-outline' : 'briefcase-outline'}
                      size={12}
                      color={role === 'AGENT' ? '#0891b2' : '#7c3aed'}
                    />
                    <Text style={[styles.previewRoleText, { color: role === 'AGENT' ? '#0891b2' : '#7c3aed' }]}>
                      {role === 'AGENT' ? 'Ish beruvchi' : 'Frilanser'}
                    </Text>
                  </View>
                </View>

                {/* Stats */}
                <View style={styles.previewStats}>
                  {[
                    { label: 'Bajarilgan', value: '0' },
                    { label: 'Reyting',    value: '5.0' },
                    { label: 'Kuzatuvchi', value: '0' },
                  ].map(s => (
                    <View key={s.label} style={styles.previewStat}>
                      <Text style={styles.previewStatVal}>{s.value}</Text>
                      <Text style={styles.previewStatLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ── Ma'lumotlar ro'yxati ── */}
              <View style={styles.previewDetails}>
                <PreviewRow icon="call-outline"     label="Telefon"       value={phone} />
                {bio      ? <PreviewRow icon="document-text-outline" label="Bio"      value={bio} lines={3} /> : null}
                {company  ? <PreviewRow icon="business-outline"      label="Kompaniya" value={company} /> : null}
                {industry ? <PreviewRow icon="grid-outline"           label="Soha"     value={industry} /> : null}
                {experience ? <PreviewRow icon="flash-outline"        label="Tajriba"  value={EXP_LABELS[experience] ?? experience} /> : null}
                {resumeName ? <PreviewRow icon="attach-outline"       label="Resume"   value={resumeName} /> : null}
              </View>

              {/* ── Ko'nikmalar ── */}
              {skills.length > 0 && (
                <View style={styles.previewSection}>
                  <Text style={styles.previewSectionTitle}>Ko'nikmalar</Text>
                  <View style={styles.chipWrap}>
                    {skills.map(s => (
                      <View key={s} style={[styles.chip, styles.chipActive]}>
                        <Text style={[styles.chipText, { color: 'white' }]}>{s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* ── Agree + Submit ── */}
              <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
                <View style={[styles.agreeCheck, agreed && styles.agreeCheckActive]}>
                  {agreed && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text style={styles.agreeText}>
                  Foydalanish <Text style={{ color: Colors.primary, fontWeight: '700' }}>shartlariga</Text>
                  {' '}va <Text style={{ color: Colors.primary, fontWeight: '700' }}>maxfiylik siyosatiga</Text> roziman
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.nextBtn, (!agreed || loading) && styles.nextBtnDisabled]}
                onPress={handleSubmit}
                disabled={!agreed || loading}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                      <Text style={styles.nextBtnText}>Ro'yxatdan o'tish</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function PreviewRow({ icon, label, value, lines = 1 }: { icon: string; label: string; value: string; lines?: number }) {
  return (
    <View style={styles.previewRow}>
      <View style={styles.previewRowIcon}>
        <Ionicons name={icon as any} size={15} color={Colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.previewRowLabel}>{label}</Text>
        <Text style={styles.previewRowValue} numberOfLines={lines}>{value}</Text>
      </View>
    </View>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldLabelRow}>
        <Ionicons name={icon as any} size={13} color={Colors.textSub} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  topBar:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  topLogo:          { width: 28, height: 28, borderRadius: 8, marginRight: 8 },
  stepLabel:        { fontSize: 15, fontWeight: '700', color: Colors.text },
  progressTrack:    { height: 3, backgroundColor: Colors.border },
  progressFill:     { height: '100%', backgroundColor: Colors.primary },
  container:        { padding: 20 },

  heading:          { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  subheading:       { fontSize: 13, color: Colors.textSub, marginBottom: 20, lineHeight: 19 },
  stepMeta:         { fontSize: 11, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },

  // Role cards
  roleRow:          { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard:         { flex: 1, borderRadius: 16, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, padding: 16, alignItems: 'center', position: 'relative' },
  roleCardActive:   { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  roleCheck:        { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  roleIconWrap:     { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  roleIconWrapActive:{ backgroundColor: '#e0e7ff', borderColor: '#a5b4fc' },
  roleTitle:        { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 6, textAlign: 'center' },
  roleDesc:         { fontSize: 11, color: Colors.textSub, textAlign: 'center', lineHeight: 16 },

  // Buttons
  nextBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, marginTop: 8 },
  nextBtnDisabled:  { backgroundColor: '#a5b4fc' },
  nextBtnText:      { color: 'white', fontWeight: '800', fontSize: 16 },
  loginLink:        { marginTop: 16, alignItems: 'center' },
  loginLinkText:    { fontSize: 14, color: Colors.textSub },

  // Fields
  fieldWrap:        { marginBottom: 14 },
  fieldLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  fieldLabel:       { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  input:            { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.white, marginBottom: 0 },
  passWrap:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.white },
  passInput:        { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text },
  passIconBtn:      { paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', height: 46 },
  passDivider:      { width: 1, height: 24, backgroundColor: Colors.border },
  passHint:         { fontSize: 11, color: Colors.textMuted, marginTop: 5 },
  bioInput:         { height: 100, textAlignVertical: 'top' },

  // Experience
  expRow:           { gap: 8 },
  expBtn:           { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  expBtnActive:     { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  expBtnText:       { fontSize: 13, fontWeight: '600', color: Colors.textSub },

  // Chips
  chipWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:         { fontSize: 12, fontWeight: '600', color: Colors.textSub },

  // Skill input
  skillInputRow:    { flexDirection: 'row', gap: 8, marginTop: 10 },
  addSkillBtn:      { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Agree
  agreeRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16, marginTop: 4 },
  agreeCheck:       { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  agreeCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agreeText:        { flex: 1, fontSize: 13, color: Colors.textSub, lineHeight: 20 },

  // Preview Card
  previewCard:         { backgroundColor: Colors.white, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 14 },
  previewCover:        { height: 80, backgroundColor: Colors.primary + '22' },
  previewAvatarWrap:   { position: 'relative', alignSelf: 'center', marginTop: -36, marginBottom: 10 },
  previewAvatar:       { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: Colors.white },
  previewAvatarFallback: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eef2ff', borderWidth: 3, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  previewAvatarText:   { fontSize: 28, fontWeight: '900', color: Colors.primary },
  previewAvailDot:     { position: 'absolute', bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: Colors.white },
  previewInfo:         { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  previewName:         { fontSize: 18, fontWeight: '900', color: Colors.text },
  previewUsername:     { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  previewProfession:   { fontSize: 13, color: Colors.textSub, marginTop: 3 },
  previewRoleBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  agentBg:             { backgroundColor: '#e0f2fe' },
  freelancerBg:        { backgroundColor: '#f5f3ff' },
  previewRoleText:     { fontSize: 12, fontWeight: '700' },
  previewStats:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
  previewStat:         { flex: 1, alignItems: 'center', paddingVertical: 12 },
  previewStatVal:      { fontSize: 18, fontWeight: '900', color: Colors.primary },
  previewStatLabel:    { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  previewDetails:      { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 4, marginBottom: 14 },
  previewRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10 },
  previewRowIcon:      { width: 30, height: 30, borderRadius: 10, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  previewRowLabel:     { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  previewRowValue:     { fontSize: 14, color: Colors.text, fontWeight: '600', marginTop: 1 },
  previewSection:      { backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 14 },
  previewSectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10 },

  // Avatar
  avatarSection:       { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatarPicker:        { width: 80, height: 80, borderRadius: 40, position: 'relative' },
  avatarImg:           { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder:   { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  avatarCameraBadge:   { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  avatarLabel:         { fontSize: 14, fontWeight: '700', color: Colors.text },
  avatarSub:           { fontSize: 12, color: Colors.textMuted, marginTop: 2 },

  // Resume
  resumeCard:          { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff5f5', borderRadius: 12, padding: 12 },
  resumeIconWrap:      { width: 40, height: 40, borderRadius: 10, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  resumeName:          { fontSize: 13, fontWeight: '700', color: Colors.text },
  resumeUploaded:      { fontSize: 11, color: '#16a34a', marginTop: 2 },
  resumeUploadBtn:     { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 12, padding: 14, backgroundColor: '#f5f3ff' },
  resumeUploadTitle:   { fontSize: 14, fontWeight: '700', color: Colors.primary },
  resumeUploadSub:     { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  // Error
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', padding: 10, marginBottom: 14 },
  errorText:        { fontSize: 13, color: '#dc2626', flex: 1 },
});
