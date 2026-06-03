import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Modal,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_MY_JOBS } from '../../apollo/queries';
import { DELETE_JOB, UPDATE_JOB, COMPLETE_JOB, BOOST_JOB, CREATE_JOB } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import MapPickerModal, { PickedAddress } from '../../components/MapPickerModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'Ochiq',   color: '#4f46e5', bg: '#eef2ff' },
  ACTIVE:    { label: 'Faol',    color: '#0891b2', bg: '#e0f2fe' },
  COMPLETED: { label: 'Tugagan', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Bekor',   color: '#dc2626', bg: '#fee2e2' },
};

const BOOST_PLANS = [
  { key: 'BASIC', name: 'Oddiy',  price: '$3',  days: '3 kun',  color: '#4f46e5', desc: "Ro'yxat tepasida 3 kun" },
  { key: 'PRO',   name: 'Pro',    price: '$7',  days: '7 kun',  color: '#7c3aed', desc: 'Binafsha chegara, 7 kun' },
  { key: 'VIP',   name: 'VIP',    price: '$15', days: '30 kun', color: '#b45309', desc: 'Oltin chegara, 30 kun' },
];

const CATEGORIES = [
  { value: 'PHOTOGRAPHY', label: 'Foto & Dron' },
  { value: 'RENDERING',   label: '3D Vizualizatsiya' },
  { value: 'LEGAL',       label: 'Yuridik' },
  { value: 'REPAIR',      label: "Ta'mirlash" },
  { value: 'CLEANING',    label: 'Tozalash' },
  { value: 'MOVING',      label: "Ko'chirish" },
  { value: 'DESIGN',      label: 'Dizayn' },
  { value: 'VALUATION',   label: 'Baholash' },
  { value: 'SECURITY',    label: 'Xavfsizlik' },
  { value: 'OTHER',       label: 'Boshqa' },
];

const EXP_LEVELS = [
  { value: 'NONE',   label: "Boshlang'ich", sub: '0–2 yil' },
  { value: 'JUNIOR', label: "O'rta",        sub: '2–5 yil' },
  { value: 'SENIOR', label: 'Yuqori',       sub: '5+ yil' },
];

const JOB_TYPES   = [{ value: 'PERMANENT', label: 'Bir martalik' }, { value: 'TEMPORARY', label: 'Doimiy' }];
const WORK_FORMATS = [{ value: 'REMOTE', label: 'Masofaviy' }, { value: 'ONSITE', label: 'Ofisda' }, { value: 'HYBRID', label: 'Gibrid' }];
const CURRENCIES   = ['UZS', 'USD', 'KRW', 'RUB'];

const STEP_LABELS = ['Tavsif', 'Talablar', "Ko'rib chiqish"];

// ─── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  return (
    <View style={stp.wrap}>
      {STEP_LABELS.map((label, idx) => {
        const n = idx + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={n}>
            <View style={stp.item}>
              <View style={[stp.circle, done && stp.done, active && stp.active]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color="white" />
                  : <Text style={[stp.num, (done || active) && { color: 'white' }]}>{n}</Text>
                }
              </View>
              <Text style={[stp.label, (done || active) && { color: Colors.primary }]}>{label}</Text>
            </View>
            {idx < STEP_LABELS.length - 1 && (
              <View style={[stp.line, done && { backgroundColor: Colors.primary }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const stp = StyleSheet.create({
  wrap:   { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 16 },
  item:   { alignItems: 'center', gap: 6, width: 72 },
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dae2fd', alignItems: 'center', justifyContent: 'center' },
  done:   { backgroundColor: Colors.primary },
  active: { backgroundColor: Colors.primary },
  num:    { fontSize: 14, fontWeight: '700', color: '#464555' },
  label:  { fontSize: 10, fontWeight: '700', color: Colors.textSub, textAlign: 'center' },
  line:   { flex: 1, height: 2, backgroundColor: '#dae2fd', marginTop: 17, marginBottom: 24 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyWorksScreen() {
  const { user } = useAuth();
  const [createModal, setCreateModal]   = useState(false);
  const [editJob, setEditJob]           = useState<Job | null>(null);
  const [boostJob2, setBoostJob2]       = useState<Job | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('PRO');

  // ── Create form state ──────────────────────────────────────────────────────
  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [cTitle, setCTitle]         = useState('');
  const [cDesc, setCDesc]           = useState('');
  const [cCategory, setCCategory]   = useState('PHOTOGRAPHY');
  const [cBudget, setCBudget]       = useState('');
  const [cCurrency, setCCurrency]   = useState('USD');
  const [cBudgetType, setCBudgetType] = useState<'fixed' | 'hourly'>('fixed');
  const [cLocation, setCLocation]   = useState<PickedAddress | null>(null);
  const [cPhone, setCPhone]         = useState('');
  const [cExp, setCExp]             = useState('');
  const [cJobType, setCJobType]     = useState('PERMANENT');
  const [cFormat, setCFormat]       = useState('REMOTE');
  const [cSkills, setCSkills]       = useState<string[]>([]);
  const [cSkillInput, setCSkillInput] = useState('');
  const [cAgreed, setCAgreed]       = useState(false);
  const [cError, setCError]         = useState('');
  const [mapModal, setMapModal]     = useState(false);

  // ── Edit form ─────────────────────────────────────────────────────────────
  const [eTitle, setETitle]   = useState('');
  const [eDesc, setEDesc]     = useState('');
  const [eBudget, setEBudget] = useState('');

  const { data, loading, refetch } = useQuery(GET_MY_JOBS, { skip: !user });
  const [createJob, { loading: creating }] = useMutation(CREATE_JOB);
  const [updateJob, { loading: updating }] = useMutation(UPDATE_JOB);
  const [deleteJob]                        = useMutation(DELETE_JOB);
  const [completeJob]                      = useMutation(COMPLETE_JOB);
  const [boostJob, { loading: boosting }]  = useMutation(BOOST_JOB);

  const jobs: Job[] = data?.getMyJobs ?? [];

  // ── Create helpers ────────────────────────────────────────────────────────
  const resetCreate = () => {
    setStep(1); setCTitle(''); setCDesc(''); setCBudget(''); setCCategory('PHOTOGRAPHY');
    setCCurrency('USD'); setCBudgetType('fixed'); setCLocation(null); setCPhone('');
    setCExp(''); setCJobType('PERMANENT'); setCFormat('REMOTE');
    setCSkills([]); setCSkillInput(''); setCAgreed(false); setCError('');
  };

  const validateStep = () => {
    if (step === 1) {
      if (!cTitle.trim() || cTitle.trim().length < 5) { setCError("Sarlavha kamida 5 belgi bo'lishi kerak"); return false; }
      if (!cDesc.trim() || cDesc.trim().length < 20)  { setCError("Tavsif kamida 20 belgi bo'lishi kerak"); return false; }
    }
    if (step === 3 && !cAgreed) { setCError("Foydalanish shartlariga rozilik kerak"); return false; }
    setCError('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(s => (s + 1) as any);
  };

  const addSkill = () => {
    const s = cSkillInput.trim();
    if (s && !cSkills.includes(s)) setCSkills(p => [...p, s]);
    setCSkillInput('');
  };

  const handleCreate = async () => {
    if (!cAgreed) { setCError("Foydalanish shartlariga rozilik kerak"); return; }
    try {
      await createJob({
        variables: {
          input: {
            title: cTitle.trim(),
            description: cDesc.trim(),
            category: cCategory,
            propertyType: 'OTHER',
            budget: cBudget ? parseFloat(cBudget) : 0,
            experienceLevel: cExp || undefined,
            jobType: cJobType || undefined,
            workFormat: [cFormat],
            location: cLocation?.name || (cLocation ? `${cLocation.latitude.toFixed(4)}, ${cLocation.longitude.toFixed(4)}` : undefined),
            requiredSkills: cSkills.length ? cSkills : undefined,
            contactPhone: cPhone.trim() || undefined,
          },
        },
      });
      refetch();
      setCreateModal(false);
      resetCreate();
    } catch (err: any) {
      setCError(err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const openEdit = (job: Job) => {
    setEditJob(job); setETitle(job.title); setEDesc(job.description ?? ''); setEBudget(String(job.budget));
  };

  const handleEdit = async () => {
    if (!editJob) return;
    try {
      await updateJob({ variables: { jobId: editJob._id, input: { title: eTitle, description: eDesc, budget: parseFloat(eBudget) } } });
      refetch(); setEditJob(null);
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato');
    }
  };

  const handleDelete = (job: Job) => {
    Alert.alert("O'chirish", `"${job.title}" ishini o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: "O'chirish", style: 'destructive', onPress: async () => {
        try { await deleteJob({ variables: { jobId: job._id } }); refetch(); }
        catch (err: any) { Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato'); }
      }},
    ]);
  };

  const handleComplete = (jobId: string) => {
    Alert.alert('Bajarildi', 'Ishni yakunlangan deb belgilaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Ha', onPress: async () => { await completeJob({ variables: { jobId } }); refetch(); } },
    ]);
  };

  const handleBoost = async () => {
    if (!boostJob2) return;
    try {
      await boostJob({ variables: { jobId: boostJob2._id, plan: selectedPlan } });
      refetch(); setBoostJob2(null);
      Alert.alert('Muvaffaqiyatli', "Ish ro'yxat tepasiga chiqarildi!");
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato');
    }
  };

  function timeAgo(d?: string) {
    if (!d) return '';
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (m < 60) return `${m} daq`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} soat`;
    return `${Math.floor(h / 24)} kun`;
  }

  // ── Job card ──────────────────────────────────────────────────────────────
  const renderJob = ({ item: job }: { item: Job }) => {
    const st = STATUS_MAP[job.status] ?? STATUS_MAP.OPEN;
    const isBoosted = !!job.boostExpiresAt && new Date(job.boostExpiresAt).getTime() > Date.now();
    return (
      <View style={[styles.jobCard, isBoosted && { borderColor: '#a78bfa', borderWidth: 1.5 }]}>
        <View style={styles.jobTop}>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          {isBoosted && (
            <View style={[styles.badge, { backgroundColor: '#f5f3ff', marginLeft: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
              <Ionicons name={job.boostPlan === 'VIP' ? 'star' : job.boostPlan === 'PRO' ? 'flash' : 'trending-up'} size={11} color="#7c3aed" />
              <Text style={[styles.badgeText, { color: '#7c3aed' }]}>{job.boostPlan === 'VIP' ? 'VIP' : job.boostPlan === 'PRO' ? 'Pro' : 'Top'}</Text>
            </View>
          )}
          <Text style={styles.timeText}>{timeAgo(job.createdAt)}</Text>
        </View>
        <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
        <View style={styles.jobMeta}>
          <Text style={styles.budget}>${job.budget}</Text>
          <Text style={styles.bids}>{job.bidCount} taklif</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/jobs/${job._id}`)}>
            <Ionicons name="eye-outline" size={16} color={Colors.primary} />
            <Text style={[styles.actionText, { color: Colors.primary }]}>Ko'rish</Text>
          </TouchableOpacity>
          {job.status === 'OPEN' && (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(job)}>
                <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
                <Text style={[styles.actionText, { color: Colors.primary }]}>Tahrir</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setBoostJob2(job); setSelectedPlan('PRO'); }}>
                <Ionicons name="rocket-outline" size={16} color="#7c3aed" />
                <Text style={[styles.actionText, { color: '#7c3aed' }]}>Top</Text>
              </TouchableOpacity>
            </>
          )}
          {job.status === 'ACTIVE' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleComplete(job._id)}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.green} />
              <Text style={[styles.actionText, { color: Colors.green }]}>Bajarildi</Text>
            </TouchableOpacity>
          )}
          {job.status !== 'ACTIVE' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(job)}>
              <Ionicons name="trash-outline" size={16} color={Colors.red} />
              <Text style={[styles.actionText, { color: Colors.red }]}>O'chirish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Mening ishlarim</Text>
          <Text style={styles.headerSub}>{jobs.length} ta ish</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { resetCreate(); setCreateModal(true); }}>
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {loading && jobs.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => j._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={renderJob}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Hali ish joylashtirilmagan</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => { resetCreate(); setCreateModal(true); }}>
                <Text style={styles.emptyBtnText}>+ Ish qo'shish</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          CREATE MODAL — 3 bosqich
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => { setCreateModal(false); resetCreate(); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yangi ish e'lon qilish</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Stepper */}
          <Stepper step={step} />

          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

              {/* Error */}
              {cError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
                  <Text style={styles.errorText}>{cError}</Text>
                </View>
              ) : null}

              {/* ─── STEP 1: Tavsif ─── */}
              {step === 1 && (
                <View>
                  <Text style={styles.stepTitle}>Tavsif</Text>
                  <Text style={styles.stepSub}>Ish haqida asosiy ma'lumotlarni kiriting</Text>

                  <Text style={styles.fieldLabel}>Ish sarlavhasi *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cTitle}
                    onChangeText={setCTitle}
                    placeholder="Masalan: Senior React Developer kerak"
                    placeholderTextColor={Colors.textMuted}
                  />

                  <Text style={styles.fieldLabel}>Kategoriya</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {CATEGORIES.map(c => (
                        <TouchableOpacity key={c.value} style={[styles.chip, cCategory === c.value && styles.chipActive]} onPress={() => setCCategory(c.value)}>
                          <Text style={[styles.chipText, cCategory === c.value && { color: 'white' }]}>{c.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>

                  <Text style={styles.fieldLabel}>Tavsif *</Text>
                  <TextInput
                    style={[styles.fieldInput, { height: 120, textAlignVertical: 'top' }]}
                    value={cDesc}
                    onChangeText={setCDesc}
                    placeholder="Ish haqida batafsil ma'lumot bering: vazifalar, talablar, natijalar..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                  />
                  <Text style={styles.charCount}>{cDesc.length} belgi</Text>

                  {/* Budget */}
                  <Text style={styles.sectionTitle}>Byudjet</Text>
                  <View style={styles.budgetTypeRow}>
                    {([{ v: 'fixed', l: 'Belgilangan narx', icon: 'document-text-outline' }, { v: 'hourly', l: 'Soatbay', icon: 'time-outline' }] as any[]).map(bt => (
                      <TouchableOpacity
                        key={bt.v}
                        style={[styles.budgetTypeBtn, cBudgetType === bt.v && styles.budgetTypeBtnActive]}
                        onPress={() => setCBudgetType(bt.v)}
                      >
                        <Ionicons name={bt.icon} size={18} color={cBudgetType === bt.v ? Colors.primary : Colors.textSub} />
                        <Text style={[styles.budgetTypeText, cBudgetType === bt.v && { color: Colors.primary }]}>{bt.l}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Valyuta</Text>
                  <View style={styles.currencyRow}>
                    {CURRENCIES.map(c => (
                      <TouchableOpacity key={c} style={[styles.currencyBtn, cCurrency === c && styles.currencyBtnActive]} onPress={() => setCCurrency(c)}>
                        <Text style={[styles.currencyText, cCurrency === c && { color: 'white' }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.budgetInputWrap}>
                    <TextInput
                      style={styles.budgetInput}
                      value={cBudget}
                      onChangeText={setCBudget}
                      placeholder={cBudgetType === 'hourly' ? '50' : '5000000'}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                    />
                    <View style={styles.budgetSuffix}>
                      <Text style={styles.budgetSuffixText}>{cBudgetType === 'hourly' ? `${cCurrency}/soat` : cCurrency}</Text>
                    </View>
                  </View>

                  {/* Location */}
                  <Text style={styles.fieldLabel}>Ish joyi manzili (ixtiyoriy)</Text>
                  <TouchableOpacity style={styles.mapPickerBtn} onPress={() => setMapModal(true)}>
                    <Ionicons name="map-outline" size={18} color={Colors.primary} />
                    <Text style={[styles.mapPickerText, cLocation && { color: Colors.text }]}>
                      {cLocation?.name
                        ? cLocation.name
                        : cLocation
                          ? `${cLocation.latitude.toFixed(5)}, ${cLocation.longitude.toFixed(5)}`
                          : 'Xaritadan manzil tanlang...'}
                    </Text>
                    {cLocation && (
                      <TouchableOpacity onPress={() => setCLocation(null)}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>

                  {/* Contact phone */}
                  <Text style={styles.fieldLabel}>Aloqa telefon raqami (ixtiyoriy)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={cPhone}
                    onChangeText={setCPhone}
                    placeholder="+998 90 123 45 67"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="phone-pad"
                  />
                </View>
              )}

              {/* ─── STEP 2: Talablar ─── */}
              {step === 2 && (
                <View>
                  <Text style={styles.stepTitle}>Talablar</Text>
                  <Text style={styles.stepSub}>Loyihangiz uchun kerakli shartlarni belgilang</Text>

                  <Text style={styles.sectionTitle}>Tajriba darajasi</Text>
                  <View style={styles.expGrid}>
                    {EXP_LEVELS.map(lvl => (
                      <TouchableOpacity
                        key={lvl.value}
                        style={[styles.expCard, cExp === lvl.value && styles.expCardActive]}
                        onPress={() => setCExp(lvl.value)}
                      >
                        <Text style={[styles.expLabel, cExp === lvl.value && { color: Colors.primary }]}>{lvl.label}</Text>
                        <Text style={styles.expSub}>{lvl.sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Ish turi</Text>
                  <View style={styles.pillRow}>
                    {JOB_TYPES.map(t => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.pill, cJobType === t.value && styles.pillActive]}
                        onPress={() => setCJobType(t.value)}
                      >
                        <Text style={[styles.pillText, cJobType === t.value && { color: 'white' }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Ish formati</Text>
                  <View style={styles.pillRow}>
                    {WORK_FORMATS.map(f => (
                      <TouchableOpacity
                        key={f.value}
                        style={[styles.pill, cFormat === f.value && styles.pillActive]}
                        onPress={() => setCFormat(f.value)}
                      >
                        <Text style={[styles.pillText, cFormat === f.value && { color: 'white' }]}>{f.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.sectionTitle}>Kerakli ko'nikmalar (ixtiyoriy)</Text>
                  <View style={styles.skillInputRow}>
                    <TextInput
                      style={[styles.fieldInput, { flex: 1, marginBottom: 0 }]}
                      value={cSkillInput}
                      onChangeText={setCSkillInput}
                      placeholder="Ko'nikma qo'shing..."
                      placeholderTextColor={Colors.textMuted}
                      onSubmitEditing={addSkill}
                      returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addSkillBtn} onPress={addSkill}>
                      <Ionicons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                  {cSkills.length > 0 && (
                    <View style={[styles.chipWrap, { marginTop: 10 }]}>
                      {cSkills.map(s => (
                        <TouchableOpacity key={s} style={[styles.chip, styles.chipActive]} onPress={() => setCSkills(p => p.filter(x => x !== s))}>
                          <Text style={[styles.chipText, { color: 'white' }]}>{s}</Text>
                          <Ionicons name="close" size={11} color="white" style={{ marginLeft: 3 }} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* ─── STEP 3: Ko'rib chiqish ─── */}
              {step === 3 && (
                <View>
                  <Text style={styles.stepTitle}>Ko'rib chiqish</Text>
                  <Text style={styles.stepSub}>E'lon joylashtirishdan oldin ma'lumotlarni tekshiring</Text>

                  {/* Preview card */}
                  <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>{cTitle || '—'}</Text>
                    <Text style={styles.previewCat}>
                      {CATEGORIES.find(c => c.value === cCategory)?.label ?? cCategory}
                      {' • '}
                      {WORK_FORMATS.find(f => f.value === cFormat)?.label}
                    </Text>

                    {cBudget ? (
                      <View style={styles.previewBudget}>
                        <Ionicons name={cBudgetType === 'hourly' ? 'time-outline' : 'wallet-outline'} size={14} color={Colors.primary} />
                        <Text style={styles.previewBudgetText}>
                          {cBudgetType === 'hourly' ? `Soatiga ${cBudget} ${cCurrency}` : `${cBudget} ${cCurrency}`}
                        </Text>
                      </View>
                    ) : null}

                    {cDesc ? <Text style={styles.previewDesc} numberOfLines={4}>{cDesc}</Text> : null}

                    <View style={styles.previewMeta}>
                      <View style={styles.previewMetaItem}>
                        <Text style={styles.previewMetaLabel}>Tajriba</Text>
                        <Text style={styles.previewMetaVal}>{EXP_LEVELS.find(e => e.value === cExp)?.label ?? "Ko'rsatilmagan"}</Text>
                      </View>
                      <View style={styles.previewMetaItem}>
                        <Text style={styles.previewMetaLabel}>Ish turi</Text>
                        <Text style={styles.previewMetaVal}>{JOB_TYPES.find(t => t.value === cJobType)?.label}</Text>
                      </View>
                      {cLocation && (
                        <View style={styles.previewMetaItem}>
                          <Text style={styles.previewMetaLabel}>Manzil</Text>
                          <Text style={styles.previewMetaVal} numberOfLines={1}>
                            {cLocation.name ?? `${cLocation.latitude.toFixed(4)}, ${cLocation.longitude.toFixed(4)}`}
                          </Text>
                        </View>
                      )}
                    </View>

                    {cSkills.length > 0 && (
                      <View style={[styles.chipWrap, { marginTop: 10 }]}>
                        {cSkills.map(s => (
                          <View key={s} style={styles.chip}>
                            <Text style={styles.chipText}>{s}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Info box */}
                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#1d4ed8" />
                    <Text style={styles.infoText}>E'lon moderatsiyadan o'tgandan so'ng <Text style={{ fontWeight: '700' }}>24 soat ichida</Text> joylashtiriladi.</Text>
                  </View>

                  {/* Agree */}
                  <TouchableOpacity style={styles.agreeRow} onPress={() => setCAgreed(!cAgreed)}>
                    <View style={[styles.agreeCheck, cAgreed && styles.agreeCheckActive]}>
                      {cAgreed && <Ionicons name="checkmark" size={14} color="white" />}
                    </View>
                    <Text style={styles.agreeText}>
                      Kiritilgan barcha ma'lumotlar to'g'riligini va platformaning{' '}
                      <Text style={{ color: Colors.primary, fontWeight: '700' }}>foydalanish shartlari</Text>
                      ga roziman
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Navigation */}
              <View style={styles.navRow}>
                {step > 1 ? (
                  <TouchableOpacity style={styles.backBtn} onPress={() => { setCError(''); setStep(s => (s - 1) as any); }}>
                    <Ionicons name="arrow-back" size={16} color={Colors.textSub} />
                    <Text style={styles.backBtnText}>Orqaga</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.backBtn} onPress={() => { setCreateModal(false); resetCreate(); }}>
                    <Text style={styles.backBtnText}>Bekor qilish</Text>
                  </TouchableOpacity>
                )}

                {step < 3 ? (
                  <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                    <Text style={styles.nextBtnText}>Keyingisi</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.submitBtn, (!cAgreed || creating) && { opacity: 0.6 }]}
                    onPress={handleCreate}
                    disabled={!cAgreed || creating}
                  >
                    {creating
                      ? <ActivityIndicator color="white" size="small" />
                      : <>
                          <Ionicons name="send-outline" size={16} color="white" />
                          <Text style={styles.nextBtnText}>E'lon qilish</Text>
                        </>
                    }
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Map Picker */}
      <MapPickerModal
        visible={mapModal}
        initial={cLocation}
        onConfirm={(addr) => { setCLocation(addr); setMapModal(false); }}
        onClose={() => setMapModal(false)}
      />

      {/* ── Edit Modal ── */}
      <Modal visible={!!editJob} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditJob(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Tahrirlash</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Sarlavha</Text>
            <TextInput style={styles.fieldInput} value={eTitle} onChangeText={setETitle} />
            <Text style={styles.fieldLabel}>Tavsif</Text>
            <TextInput style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]} value={eDesc} onChangeText={setEDesc} multiline />
            <Text style={styles.fieldLabel}>Byudjet ($)</Text>
            <TextInput style={styles.fieldInput} value={eBudget} onChangeText={setEBudget} keyboardType="numeric" />
            <TouchableOpacity style={[styles.nextBtn, { borderRadius: 12, justifyContent: 'center', paddingVertical: 14 }, updating && { opacity: 0.7 }]} onPress={handleEdit} disabled={updating}>
              {updating ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>Saqlash</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Boost Modal ── */}
      <Modal visible={!!boostJob2} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setBoostJob2(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="rocket-outline" size={18} color={Colors.text} />
              <Text style={styles.modalTitle}>Top ga chiqazish</Text>
            </View>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={{ fontSize: 13, color: Colors.textSub, marginBottom: 16 }}>
              Ish e'loningizni ro'yxat tepasiga chiqaring — ko'proq frilanserlar ko'radi.
            </Text>
            {BOOST_PLANS.map(plan => (
              <TouchableOpacity key={plan.key} style={[styles.planCard, selectedPlan === plan.key && { borderColor: plan.color, borderWidth: 2 }]} onPress={() => setSelectedPlan(plan.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                  <Text style={styles.planDays}>{plan.days}</Text>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  {selectedPlan === plan.key && <Ionicons name="checkmark-circle" size={22} color={plan.color} />}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextBtn, { borderRadius: 12, justifyContent: 'center', paddingVertical: 14, backgroundColor: BOOST_PLANS.find(p => p.key === selectedPlan)?.color ?? Colors.primary }, boosting && { opacity: 0.7 }]}
              onPress={handleBoost} disabled={boosting}
            >
              {boosting ? <ActivityIndicator color="white" /> : <Text style={styles.nextBtnText}>To'lash va tepaga chiqazish</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:      { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub:        { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  addBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  list:             { paddingHorizontal: 16, paddingBottom: 20 },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:            { alignItems: 'center', paddingTop: 60 },
  emptyText:        { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
  emptyBtn:         { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText:     { color: 'white', fontWeight: '700', fontSize: 15 },
  jobCard:          { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  jobTop:           { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge:            { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:        { fontSize: 11, fontWeight: '700' },
  timeText:         { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  jobTitle:         { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  jobMeta:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budget:           { fontSize: 16, fontWeight: '900', color: Colors.green },
  bids:             { fontSize: 13, color: Colors.textMuted },
  actions:          { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  actionText:       { fontSize: 12, fontWeight: '600' },

  // Modal
  modalSafe:        { flex: 1, backgroundColor: Colors.white },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:       { fontSize: 17, fontWeight: '800', color: Colors.text },
  modalBody:        { padding: 20 },

  // Steps
  stepTitle:        { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  stepSub:          { fontSize: 13, color: Colors.textSub, marginBottom: 20 },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 10, marginTop: 6 },

  // Fields
  fieldLabel:       { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  fieldInput:       { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  charCount:        { fontSize: 11, color: Colors.textMuted, textAlign: 'right', marginTop: -10, marginBottom: 14 },

  // Budget
  budgetTypeRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  budgetTypeBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  budgetTypeBtnActive: { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  budgetTypeText:   { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  currencyRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  currencyBtn:      { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  currencyBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  currencyText:     { fontSize: 12, fontWeight: '700', color: Colors.textSub },
  budgetInputWrap:  { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, overflow: 'hidden', marginBottom: 14, backgroundColor: Colors.bg },
  budgetInput:      { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text, fontWeight: '700' },
  budgetSuffix:     { paddingHorizontal: 14, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: Colors.border, backgroundColor: Colors.white },
  budgetSuffixText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  // Map
  mapPickerBtn:     { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.bg, marginBottom: 14 },
  mapPickerText:    { flex: 1, fontSize: 15, color: Colors.textMuted },

  // Chips
  chipWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipActive:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText:         { fontSize: 12, fontWeight: '600', color: Colors.textSub },

  // Experience
  expGrid:          { flexDirection: 'row', gap: 8, marginBottom: 14 },
  expCard:          { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg },
  expCardActive:    { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  expLabel:         { fontSize: 13, fontWeight: '700', color: Colors.text },
  expSub:           { fontSize: 11, color: Colors.textSub, marginTop: 2 },

  // Pills
  pillRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  pill:             { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  pillActive:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText:         { fontSize: 13, fontWeight: '600', color: Colors.textSub },

  // Skills input
  skillInputRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  addSkillBtn:      { width: 46, height: 46, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Preview
  previewCard:      { backgroundColor: Colors.bg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  previewTitle:     { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
  previewCat:       { fontSize: 13, fontWeight: '600', color: Colors.primary, marginBottom: 10 },
  previewBudget:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  previewBudgetText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  previewDesc:      { fontSize: 13, color: Colors.textSub, lineHeight: 20, marginBottom: 12 },
  previewMeta:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  previewMetaItem:  { minWidth: 80 },
  previewMetaLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  previewMetaVal:   { fontSize: 13, fontWeight: '700', color: Colors.text, marginTop: 2 },

  // Info
  infoBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, backgroundColor: '#eff6ff', borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 14 },
  infoText:         { flex: 1, fontSize: 13, color: '#1d4ed8', lineHeight: 20 },

  // Agree
  agreeRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  agreeCheck:       { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  agreeCheckActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  agreeText:        { flex: 1, fontSize: 13, color: Colors.textSub, lineHeight: 20 },

  // Navigation
  navRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  backBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 16 },
  backBtnText:      { fontSize: 14, fontWeight: '600', color: Colors.textSub },
  nextBtn:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  nextBtnText:      { color: 'white', fontWeight: '800', fontSize: 15 },
  submitBtn:        { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },

  // Error
  errorBox:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', borderRadius: 10, borderWidth: 1, borderColor: '#fecaca', padding: 10, marginBottom: 14 },
  errorText:        { fontSize: 13, color: '#dc2626', flex: 1 },

  // Boost
  planCard:         { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  planName:         { fontSize: 16, fontWeight: '800' },
  planDesc:         { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  planDays:         { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  planRight:        { alignItems: 'flex-end', gap: 4 },
  planPrice:        { fontSize: 20, fontWeight: '900' },
});
