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

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'Ochiq',   color: '#4f46e5', bg: '#eef2ff' },
  ACTIVE:    { label: 'Faol',    color: '#0891b2', bg: '#e0f2fe' },
  COMPLETED: { label: 'Tugagan', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Bekor',   color: '#dc2626', bg: '#fee2e2' },
};

const BOOST_PLANS = [
  { key: 'BASIC', name: 'Oddiy',  price: '$3',  days: '3 kun',  color: '#4f46e5', desc: 'Ro\'yxat tepasida 3 kun' },
  { key: 'PRO',   name: 'Pro',    price: '$7',  days: '7 kun',  color: '#7c3aed', desc: 'Binafsha chegara, 7 kun' },
  { key: 'VIP',   name: 'VIP',    price: '$15', days: '30 kun', color: '#b45309', desc: 'Oltin chegara, 30 kun' },
];

const CATEGORIES = [
  { value: 'PHOTOGRAPHY', label: 'Foto & Dron' },
  { value: 'RENDERING',   label: '3D Vizualizatsiya' },
  { value: 'LEGAL',       label: 'Yuridik xizmatlar' },
  { value: 'REPAIR',      label: 'Ta\'mirlash' },
  { value: 'CLEANING',    label: 'Tozalash' },
  { value: 'MOVING',      label: 'Ko\'chirish' },
  { value: 'DESIGN',      label: 'Dizayn' },
  { value: 'VALUATION',   label: 'Baholash' },
  { value: 'SECURITY',    label: 'Xavfsizlik' },
  { value: 'OTHER',       label: 'Boshqa' },
];

const PROPERTY_TYPES = [
  { value: 'APARTMENT',   label: 'Kvartira' },
  { value: 'HOUSE',       label: 'Uy' },
  { value: 'OFFICE',      label: 'Ofis' },
  { value: 'LAND',        label: 'Yer' },
  { value: 'COMMERCIAL',  label: 'Tijorat' },
  { value: 'OTHER',       label: 'Boshqa' },
];

export default function MyWorksScreen() {
  const { user } = useAuth();
  const [createModal, setCreateModal]   = useState(false);
  const [editJob, setEditJob]           = useState<Job | null>(null);
  const [boostJob2, setBoostJob2]       = useState<Job | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('PRO');

  // Create form
  const [cTitle, setCTitle]       = useState('');
  const [cDesc, setCDesc]         = useState('');
  const [cBudget, setCBudget]     = useState('');
  const [cCategory, setCCategory] = useState('PHOTOGRAPHY');
  const [cPropType, setCPropType] = useState('APARTMENT');

  // Edit form
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

  const handleCreate = async () => {
    if (!cTitle.trim() || !cDesc.trim() || !cBudget) return;
    try {
      await createJob({ variables: { input: {
        title: cTitle.trim(), description: cDesc.trim(),
        budget: parseFloat(cBudget), category: cCategory, propertyType: cPropType,
      }}});
      refetch();
      setCreateModal(false);
      setCTitle(''); setCDesc(''); setCBudget('');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const openEdit = (job: Job) => {
    setEditJob(job); setETitle(job.title); setEDesc(job.description); setEBudget(String(job.budget));
  };

  const handleEdit = async () => {
    if (!editJob) return;
    try {
      await updateJob({ variables: { jobId: editJob._id, input: { title: eTitle, description: eDesc, budget: parseFloat(eBudget) }}});
      refetch(); setEditJob(null);
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato');
    }
  };

  const handleDelete = (job: Job) => {
    Alert.alert('O\'chirish', `"${job.title}" ishini o'chirasizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: 'O\'chirish', style: 'destructive', onPress: async () => {
        try { await deleteJob({ variables: { jobId: job._id } }); refetch(); }
        catch (err: any) { Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato'); }
      }},
    ]);
  };

  const handleComplete = (jobId: string) => {
    Alert.alert('Bajarildi', 'Ishni yakunlangan deb belgilaysizmi?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Ha', onPress: async () => { await completeJob({ variables: { jobId } }); refetch(); }},
    ]);
  };

  const handleBoost = async () => {
    if (!boostJob2) return;
    try {
      await boostJob({ variables: { jobId: boostJob2._id, plan: selectedPlan } });
      refetch(); setBoostJob2(null);
      Alert.alert('✅ Muvaffaqiyatli', 'Ish ro\'yxat tepasiga chiqarildi!');
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
              <Ionicons
                name={job.boostPlan === 'VIP' ? 'star' : job.boostPlan === 'PRO' ? 'flash' : 'trending-up'}
                size={11}
                color="#7c3aed"
              />
              <Text style={[styles.badgeText, { color: '#7c3aed' }]}>
                {job.boostPlan === 'VIP' ? 'VIP' : job.boostPlan === 'PRO' ? 'Pro' : 'Top'}
              </Text>
            </View>
          )}
          <Text style={styles.timeText}>{timeAgo(job.createdAt)}</Text>
        </View>
        <Text style={styles.jobTitle} numberOfLines={2}>{job.title}</Text>
        <View style={styles.jobMeta}>
          <Text style={styles.budget}>${job.budget}</Text>
          <Text style={styles.bids}>{job.bidCount} taklif</Text>
        </View>
        {/* Action buttons */}
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
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
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
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateModal(true)}>
                <Text style={styles.emptyBtnText}>+ Ish qo'shish</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Create Modal ── */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi ish</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Sarlavha *</Text>
              <TextInput style={styles.fieldInput} value={cTitle} onChangeText={setCTitle} placeholder="Ish nomi..." placeholderTextColor={Colors.textMuted} />

              <Text style={styles.fieldLabel}>Tavsif *</Text>
              <TextInput style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]} value={cDesc} onChangeText={setCDesc} placeholder="Ish haqida batafsil..." placeholderTextColor={Colors.textMuted} multiline />

              <Text style={styles.fieldLabel}>Byudjet ($) *</Text>
              <TextInput style={styles.fieldInput} value={cBudget} onChangeText={setCBudget} placeholder="100" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />

              <Text style={styles.fieldLabel}>Kategoriya</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity key={c.value} style={[styles.selBtn, cCategory === c.value && styles.selBtnActive]} onPress={() => setCCategory(c.value)}>
                      <Text style={[styles.selBtnText, cCategory === c.value && { color: Colors.primary }]}>{c.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <Text style={styles.fieldLabel}>Mulk turi</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {PROPERTY_TYPES.map(p => (
                    <TouchableOpacity key={p.value} style={[styles.selBtn, cPropType === p.value && styles.selBtnActive]} onPress={() => setCPropType(p.value)}>
                      <Text style={[styles.selBtnText, cPropType === p.value && { color: Colors.primary }]}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={[styles.btn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>E'lon qilish</Text>}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal visible={!!editJob} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tahrirlash</Text>
            <TouchableOpacity onPress={() => setEditJob(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Sarlavha</Text>
            <TextInput style={styles.fieldInput} value={eTitle} onChangeText={setETitle} />
            <Text style={styles.fieldLabel}>Tavsif</Text>
            <TextInput style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]} value={eDesc} onChangeText={setEDesc} multiline />
            <Text style={styles.fieldLabel}>Byudjet ($)</Text>
            <TextInput style={styles.fieldInput} value={eBudget} onChangeText={setEBudget} keyboardType="numeric" />
            <TouchableOpacity style={[styles.btn, updating && { opacity: 0.7 }]} onPress={handleEdit} disabled={updating}>
              {updating ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Saqlash</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Boost Modal ── */}
      <Modal visible={!!boostJob2} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="rocket-outline" size={20} color={Colors.text} />
              <Text style={styles.modalTitle}>Top ga chiqazish</Text>
            </View>
            <TouchableOpacity onPress={() => setBoostJob2(null)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={{ fontSize: 13, color: Colors.textSub, marginBottom: 16 }}>
              Ish e'loningizni ro'yxat tepasiga chiqaring — ko'proq frilanserlar ko'radi.
            </Text>
            {BOOST_PLANS.map(plan => (
              <TouchableOpacity
                key={plan.key}
                style={[styles.planCard, selectedPlan === plan.key && { borderColor: plan.color, borderWidth: 2 }]}
                onPress={() => setSelectedPlan(plan.key)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <Text style={styles.planDesc}>{plan.desc}</Text>
                  <Text style={styles.planDays}>{plan.days}</Text>
                </View>
                <View style={styles.planRight}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  {selectedPlan === plan.key && (
                    <Ionicons name="checkmark-circle" size={22} color={plan.color} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: BOOST_PLANS.find(p => p.key === selectedPlan)?.color ?? Colors.primary }, boosting && { opacity: 0.7 }]}
              onPress={handleBoost} disabled={boosting}
            >
              {boosting
                ? <ActivityIndicator color="white" />
                : <Text style={styles.btnText}>To'lash va tepaga chiqazish</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub:    { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  addBtn:       { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  list:         { paddingHorizontal: 16, paddingBottom: 20 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyText:    { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
  emptyBtn:     { marginTop: 16, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  jobCard:      { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, elevation: 2 },
  jobTop:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  timeText:     { fontSize: 11, color: Colors.textMuted, marginLeft: 'auto' },
  jobTitle:     { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  jobMeta:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  budget:       { fontSize: 16, fontWeight: '900', color: Colors.green },
  bids:         { fontSize: 13, color: Colors.textMuted },
  actions:      { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border },
  actionText:   { fontSize: 12, fontWeight: '600' },
  // Modal
  modalSafe:    { flex: 1, backgroundColor: Colors.white },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:   { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody:    { padding: 20 },
  fieldLabel:   { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  fieldInput:   { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  selBtn:       { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  selBtnActive: { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  selBtnText:   { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  btn:          { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:      { color: 'white', fontWeight: '800', fontSize: 16 },
  // Boost
  planCard:     { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: Colors.border, flexDirection: 'row', alignItems: 'center' },
  planName:     { fontSize: 16, fontWeight: '800' },
  planDesc:     { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  planDays:     { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  planRight:    { alignItems: 'flex-end', gap: 4 },
  planPrice:    { fontSize: 20, fontWeight: '900' },
});
