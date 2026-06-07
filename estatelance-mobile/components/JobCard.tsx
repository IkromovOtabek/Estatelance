import React, { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Image, Alert, ActivityIndicator,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useLazyQuery } from '@apollo/client';
import { Linking } from 'react-native';
import { Colors } from '../constants/colors';
import { Job } from '../types';
import { safeImageUri } from '../libs/safeImage';
import { useAuth } from '../hooks/useAuth';
import { useFavorites } from '../hooks/useFavorites';
import { useToast } from './Toast';
import { CREATE_BID } from '../apollo/mutations';
import { GET_USER_BY_ID } from '../apollo/queries';
import { router } from 'expo-router';
import BottomSheet from './BottomSheet';

const EXP_LABELS: Record<string, string> = {
  JUNIOR:  'Junior (1-2 yil)',
  MIDDLE:  'Middle (3-5 yil)',
  SENIOR:  'Senior (5+ yil)',
  NO_EXP:  'Tajribasiz',
  ANY:     'Istalgan daraja',
};

const CAT_LABELS: Record<string, string> = {
  VISUALS:    'Foto & Dron',
  STAGING:    '3D Staging',
  RENDERING:  '3D Render',
  LEGAL:      'Yuridik',
  REPAIR:     "Ta'mirlash",
  CLEANING:   'Tozalash',
  MOVING:     "Ko'chirish",
  DESIGN:     'Dizayn',
  INSPECTION: 'Baholash',
  IT:         'IT',
  MARKETING:  'Marketing',
  TRANSLATION:'Tarjima',
  ACCOUNTING: 'Buxgalteriya',
  SECURITY:   'Xavfsizlik',
  OTHER:      'Boshqa',
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)              return 'Hozirgina';
  if (diff < 3600)            return `${Math.floor(diff / 60)} daq oldin`;
  if (diff < 86400)           return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 86400 * 2)       return 'Kecha';
  if (diff < 86400 * 7)       return `${Math.floor(diff / 86400)} kun oldin`;
  if (diff < 86400 * 30)      return `${Math.floor(diff / 604800)} hafta oldin`;
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatBudget(job: Job): string {
  if (job.salaryFrom && job.salaryTo) return `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`;
  if (job.salaryFrom) return `$${job.salaryFrom.toLocaleString()}+`;
  if (job.budget) return `$${job.budget.toLocaleString()}`;
  return '';
}

interface Props { job: Job; onPress: () => void; onMessage?: () => void; }

export default function JobCard({ job, onPress, onMessage }: Props) {
  const { themeKey } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.white,
      borderRadius: 18,
      padding: 18,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    boostedCard:  { borderColor: '#a78bfa', borderWidth: 1.5 },
    viewsRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    viewsDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e', marginRight: 6 },
    viewsText:    { flex: 1, fontSize: 12, color: '#22c55e', fontWeight: '600' },
    heartBtn:     { padding: 2 },
    title:        { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6, lineHeight: 24 },
    companyRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    companyName:  { fontSize: 14, fontWeight: '600', color: Colors.textSub },
    locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    locationText: { fontSize: 13, color: Colors.textSub, flex: 1 },
    tagsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    tag:          { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    tagText:      { fontSize: 13, color: Colors.textSub, fontWeight: '500' },
    budgetTag:    { backgroundColor: '#ecfdf5' },
    budgetTagText:{ fontSize: 13, color: '#16a34a', fontWeight: '700' },
    metaRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    dateText:     { fontSize: 12, color: Colors.textMuted },
    bidsChip:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
    bidsText:     { fontSize: 12, color: Colors.textMuted },
    actions:      { flexDirection: 'row', gap: 10 },
    applyBtn:     { flex: 1, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
    applyBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
    msgBtn:       { flex: 0.55, backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
    msgBtnText:   { color: Colors.primary, fontWeight: '700', fontSize: 15 },
    backdrop:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
      backgroundColor: Colors.white,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    sheetHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    sheetTitle:       { fontSize: 18, fontWeight: '800', color: Colors.text },
    sheetSubtitle:    { fontSize: 13, color: Colors.textSub, marginTop: 2, maxWidth: 260 },
    closeBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    userCard:         { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.bg, borderRadius: 16, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.border },
    userAvatar:       { width: 52, height: 52, borderRadius: 26 },
    userAvatarFallback:{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    userAvatarText:   { fontSize: 20, fontWeight: '900', color: Colors.primary },
    userRole:         { fontSize: 15, fontWeight: '700', color: Colors.text },
    userMeta:         { fontSize: 13, color: Colors.textSub, marginTop: 2 },
    sheetApplyBtn:    { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
    sheetApplyBtnText:{ color: 'white', fontWeight: '800', fontSize: 16 },
    sheetCoverBtn:    { backgroundColor: Colors.primary + '15', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
    sheetCoverBtnText:{ color: Colors.primary, fontWeight: '700', fontSize: 16 },
    contactCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bg, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.border, gap: 12 },
    contactLabel:  { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
    contactPhone:  { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 4, flexShrink: 1 },
    contactHours:  { fontSize: 12, color: Colors.textSub, lineHeight: 17, flexShrink: 1 },
    bidLabel:        { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
    bidInput:        { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 16 },
    addCoverBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, marginBottom: 16 },
    addCoverText:    { fontSize: 14, color: Colors.primary, fontWeight: '600' },
    coverLabelRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    coverRemoveText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
    callBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    coverInput:       { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, height: 140, marginBottom: 16 },
  }), [themeKey]);
  const { user } = useAuth();
  const { toggle, isFavorite } = useFavorites();
  const { show: showToast } = useToast();
  const saved = isFavorite(job._id);
  const [applyModal, setApplyModal]     = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [coverLetter, setCoverLetter]   = useState('');
  const [showCover, setShowCover]       = useState(false);
  const [bidAmount, setBidAmount]       = useState(String(user?.hourlyRate ?? ''));

  const [createBid, { loading: bidding }] = useMutation(CREATE_BID);
  const [fetchAgent, { data: agentData, loading: agentLoading }] = useLazyQuery(GET_USER_BY_ID);

  const openContact = () => {
    setContactModal(true);
    fetchAgent({ variables: { userId: job.agentId } });
  };

  const agent = agentData?.getUserById;

  const isBoosted = !!job.boostExpiresAt && new Date(job.boostExpiresAt).getTime() > Date.now();
  const viewCount = Math.max(1, (parseInt(job._id.slice(-2), 16) % 9) + 1);
  const expLabel  = job.experienceLevel ? EXP_LABELS[job.experienceLevel] : null;
  const budget    = formatBudget(job);
  const date      = formatDate(job.createdAt);

  const submitBid = async (letter?: string) => {
    const amount = parseFloat(bidAmount);
    if (!bidAmount || isNaN(amount) || amount < 1) {
      Alert.alert('Xato', 'Taklif narxini kiriting (minimum $1)');
      return;
    }
    // coverLetter ixtiyoriy — bo'sh bo'lsa default yuboramiz
    const finalLetter = letter?.trim() || '—';
    try {
      await createBid({
        variables: {
          input: {
            jobId:       job._id,
            bidAmount:   amount,
            coverLetter: finalLetter,
          },
        },
      });
      setApplyModal(false);
      setCoverLetter('');
      setShowCover(false);
      showToast({ message: 'Taklifingiz muvaffaqiyatli yuborildi!', type: 'success' });
    } catch (e: any) {
      Alert.alert('Xato', e?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const initials = ((user?.fullName ?? user?.username ?? '?')[0]).toUpperCase();

  return (
    <>
      <TouchableOpacity
        style={[styles.card, isBoosted && styles.boostedCard]}
        onPress={onPress}
        activeOpacity={0.88}
      >
        {/* Ko'rishlar soni */}
        <View style={styles.viewsRow}>
          <View style={styles.viewsDot} />
          <Text style={styles.viewsText}>Hozir {viewCount} kishi ko'rmoqda</Text>
          <TouchableOpacity
            onPress={async () => {
              const added = await toggle(job);
              showToast({ message: added ? "Sevimlilarga qo'shildi" : 'Sevimlilardan olib tashlandi', type: added ? 'success' : 'info' });
            }}
            style={styles.heartBtn}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={22}
              color={saved ? '#ef4444' : Colors.textSub}
            />
          </TouchableOpacity>
        </View>

        {/* Sarlavha */}
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>

        {/* Kompaniya */}
        {job.agentName ? (
          <View style={styles.companyRow}>
            <Text style={styles.companyName}>{job.agentName}</Text>
            {isBoosted && (
              <Ionicons name="checkmark-circle" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />
            )}
          </View>
        ) : null}

        {/* Joylashuv */}
        {job.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSub} />
            <Text style={styles.locationText} numberOfLines={1}>{job.location}</Text>
          </View>
        ) : null}

        {/* Teglar */}
        <View style={styles.tagsRow}>
          {expLabel ? (
            <View style={styles.tag}>
              <Ionicons name="briefcase-outline" size={13} color={Colors.textSub} />
              <Text style={styles.tagText}>Tajriba: {expLabel}</Text>
            </View>
          ) : null}
          {job.category ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{CAT_LABELS[job.category] ?? job.category}</Text>
            </View>
          ) : null}
          {budget ? (
            <View style={[styles.tag, styles.budgetTag]}>
              <Text style={styles.budgetTagText}>{budget}</Text>
            </View>
          ) : null}
        </View>

        {/* Sana + takliflar */}
        <View style={styles.metaRow}>
          {date ? <Text style={styles.dateText}>Joylashtirilgan {date}</Text> : null}
          <View style={styles.bidsChip}>
            <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.bidsText}>{job.bidCount ?? 0} taklif</Text>
          </View>
        </View>

        {/* Tugmalar */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => {
              if (!user) { router.push('/(auth)/login' as any); return; }
              setApplyModal(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>Taklif yuborish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => {
              if (!user) { router.push('/(auth)/login' as any); return; }
              openContact();
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.msgBtnText}>Bog'lanish</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ── Apply bottom sheet ── */}
      <Modal
        visible={applyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setApplyModal(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setApplyModal(false)} />
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Taklif yuborish</Text>
                <Text style={styles.sheetSubtitle} numberOfLines={1}>{job.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setApplyModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* User card */}
            <View style={styles.userCard}>
              {safeImageUri(user?.profileImage) ? (
                <Image source={{ uri: safeImageUri(user?.profileImage) }} style={styles.userAvatar} />
              ) : (
                <View style={styles.userAvatarFallback}>
                  <Text style={styles.userAvatarText}>{initials}</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.userRole}>
                  {user?.freelancerCategory ?? user?.fullName ?? user?.username}
                </Text>
                <Text style={styles.userMeta}>
                  {user?.hourlyRate ? `Soatlik: $${user.hourlyRate}` : 'Frilanser'}
                </Text>
              </View>
            </View>

            {/* Narx */}
            <Text style={styles.bidLabel}>Taklif narxi ($) *</Text>
            <TextInput
              style={styles.bidInput}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              placeholder="Masalan: 150"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Xat qo'shish toggle */}
            {!showCover ? (
              <TouchableOpacity
                style={styles.addCoverBtn}
                onPress={() => setShowCover(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.addCoverText}>Xat qo'shish (ixtiyoriy)</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.coverLabelRow}>
                  <Text style={styles.bidLabel}>Qisqacha xat</Text>
                  <TouchableOpacity onPress={() => { setShowCover(false); setCoverLetter(''); }}>
                    <Text style={styles.coverRemoveText}>O'chirish</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.bidInput, { height: 90, textAlignVertical: 'top' }]}
                  value={coverLetter}
                  onChangeText={setCoverLetter}
                  placeholder="Nima uchun siz eng yaxshi tanlovsiz..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  autoFocus
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.sheetApplyBtn, bidding && { opacity: 0.7 }]}
              onPress={() => submitBid(coverLetter)}
              disabled={bidding}
              activeOpacity={0.85}
            >
              {bidding
                ? <ActivityIndicator color="white" />
                : <Text style={styles.sheetApplyBtnText}>Taklif yuborish</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Contact bottom sheet ── */}
      <Modal
        visible={contactModal}
        transparent
        animationType="slide"
        onRequestClose={() => setContactModal(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setContactModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>{agent?.fullName ?? job.agentName ?? '—'}</Text>
              <Text style={styles.sheetSubtitle}>{job.agentName ?? ''}</Text>
            </View>
            <TouchableOpacity onPress={() => setContactModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {agentLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginVertical: 24 }} />
          ) : (
            <View style={styles.contactCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Asosiy telefon</Text>
                <Text style={styles.contactPhone}>
                  {agent?.phoneNumber ?? 'Ko\'rsatilmagan'}
                </Text>
                <Text style={styles.contactHours}>
                  Qo'ng'iroq vaqti: 10:00 – 18:00 (Dush–Juma)
                </Text>
              </View>
              {agent?.phoneNumber ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL(`tel:${agent.phoneNumber}`)}
                >
                  <Ionicons name="call" size={22} color={Colors.textSub} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={styles.sheetApplyBtn}
            onPress={() => {
              setContactModal(false);
              router.push(`/messages/${job.agentId}`);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.sheetApplyBtnText}>Xabar yozish</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </>
  );
}

