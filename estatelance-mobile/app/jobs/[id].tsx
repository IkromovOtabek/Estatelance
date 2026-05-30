import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_JOB_BY_ID, GET_BIDS_FOR_JOB } from '../../apollo/queries';
import { CREATE_BID, ACCEPT_BID } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { Bid } from '../../types';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'Ochiq',   color: '#4f46e5', bg: '#eef2ff' },
  ACTIVE:    { label: 'Faol',    color: '#0891b2', bg: '#e0f2fe' },
  COMPLETED: { label: 'Tugagan', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Bekor',   color: '#dc2626', bg: '#fee2e2' },
};

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [bidModal, setBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const { data: jobData, loading: jobLoading } = useQuery(GET_JOB_BY_ID, { variables: { jobId: id } });
  const { data: bidsData, refetch: refetchBids } = useQuery(GET_BIDS_FOR_JOB, {
    variables: { jobId: id },
    skip: !user,
  });

  const [createBid, { loading: submitting }] = useMutation(CREATE_BID);
  const [acceptBid] = useMutation(ACCEPT_BID);

  const job = jobData?.getJobById;
  const bids: Bid[] = bidsData?.getBidsForJob ?? [];
  const isOwner = job?.agentId === user?._id;
  const isFreelancer = user?.userType === 'FREELANCER';
  const myBid = bids.find(b => b.freelancerId === user?._id);

  const handleBid = async () => {
    if (!bidAmount || !coverLetter.trim()) {
      Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    try {
      await createBid({ variables: { input: { jobId: id, bidAmount: parseFloat(bidAmount), coverLetter: coverLetter.trim() } } });
      setBidModal(false);
      setBidAmount(''); setCoverLetter('');
      refetchBids();
      Alert.alert('✅', 'Taklifingiz yuborildi!');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const handleAccept = (bidId: string, name?: string) => {
    Alert.alert('Tasdiqlash', `${name ?? 'Freelancer'} ni yollaysizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Ha', onPress: async () => {
        try { await acceptBid({ variables: { bidId } }); refetchBids(); Alert.alert('✅', 'Freelancer yollandi!'); }
        catch (err: any) { Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato'); }
      }},
    ]);
  };

  if (jobLoading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!job) {
    return <View style={styles.center}><Text>Ish topilmadi</Text></View>;
  }

  const st = STATUS_MAP[job.status] ?? STATUS_MAP.OPEN;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Back */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{job.title}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Status + budget */}
          <View style={styles.topRow}>
            <View style={[styles.badge, { backgroundColor: st.bg }]}>
              <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={styles.budget}>${job.budget}</Text>
          </View>

          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.agentName}>👤 {job.agentName}</Text>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tavsif</Text>
            <Text style={styles.desc}>{job.description}</Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tafsilotlar</Text>
            {[
              job.location       && { label: '📍 Joylashuv',    value: job.location },
              job.experienceLevel && { label: '⚡ Tajriba',       value: job.experienceLevel },
              job.jobType        && { label: '💼 Ish turi',       value: job.jobType },
              job.workSchedule   && { label: '🕐 Jadval',         value: job.workSchedule },
              job.salaryFrom     && { label: '💰 Maosh',          value: `$${job.salaryFrom}–$${job.salaryTo ?? '?'}` },
            ].filter(Boolean).map((d: any) => (
              <View key={d.label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          {/* Required skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Talab qilinadigan ko'nikmalar</Text>
              <View style={styles.skillsWrap}>
                {job.requiredSkills.map((s: string) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillText}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bids section (owner only) */}
          {isOwner && bids.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Takliflar ({bids.length})</Text>
              {bids.map(bid => (
                <View key={bid._id} style={styles.bidCard}>
                  <View style={styles.bidTop}>
                    <Text style={styles.bidName}>{bid.freelancerName}</Text>
                    <Text style={styles.bidAmount}>${bid.bidAmount}</Text>
                  </View>
                  <Text style={styles.bidCover} numberOfLines={3}>{bid.coverLetter}</Text>
                  {bid.status === 'PENDING' && job.status === 'OPEN' && (
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => handleAccept(bid._id, bid.freelancerName)}
                    >
                      <Text style={styles.acceptBtnText}>✅ Yollash</Text>
                    </TouchableOpacity>
                  )}
                  {bid.status === 'ACCEPTED' && (
                    <View style={styles.acceptedBadge}>
                      <Text style={styles.acceptedText}>✅ Yollangan</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bid button (freelancer, open job, not owner, not already bid) */}
      {isFreelancer && job.status === 'OPEN' && !isOwner && !myBid && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.bidBtn} onPress={() => setBidModal(true)}>
            <Ionicons name="paper-plane" size={18} color="white" />
            <Text style={styles.bidBtnText}>Taklif yuborish</Text>
          </TouchableOpacity>
        </View>
      )}
      {myBid && (
        <View style={styles.footer}>
          <View style={[styles.bidBtn, { backgroundColor: Colors.green }]}>
            <Ionicons name="checkmark-circle" size={18} color="white" />
            <Text style={styles.bidBtnText}>Taklif yuborildi (${myBid.bidAmount})</Text>
          </View>
        </View>
      )}

      {/* Bid Modal */}
      <Modal visible={bidModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Taklif yuborish</Text>
              <TouchableOpacity onPress={() => setBidModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Taklif narxi ($) *</Text>
              <TextInput
                style={styles.fieldInput} value={bidAmount} onChangeText={setBidAmount}
                keyboardType="numeric" placeholder="Masalan: 150" placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.fieldLabel}>Motivatsion xat *</Text>
              <TextInput
                style={[styles.fieldInput, { height: 140, textAlignVertical: 'top' }]}
                value={coverLetter} onChangeText={setCoverLetter}
                placeholder="Nega siz eng yaxshi tanlov ekanligingizni tushuntiring..."
                placeholderTextColor={Colors.textMuted} multiline
              />
              <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.7 }]} onPress={handleBid} disabled={submitting}>
                {submitting ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Taklif yuborish</Text>}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { marginRight: 12 },
  topTitle:      { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  container:     { padding: 16 },
  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText:     { fontSize: 13, fontWeight: '700' },
  budget:        { fontSize: 22, fontWeight: '900', color: Colors.green },
  title:         { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 6 },
  agentName:     { fontSize: 14, color: Colors.textSub, marginBottom: 16 },
  section:       { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  desc:          { fontSize: 14, color: Colors.textSub, lineHeight: 22 },
  detailRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.bg },
  detailLabel:   { fontSize: 13, color: Colors.textSub },
  detailValue:   { fontSize: 13, fontWeight: '600', color: Colors.text },
  skillsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:     { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  skillText:     { fontSize: 13, color: Colors.textSub },
  bidCard:       { backgroundColor: Colors.bg, borderRadius: 10, padding: 12, marginBottom: 10 },
  bidTop:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  bidName:       { fontSize: 14, fontWeight: '700', color: Colors.text },
  bidAmount:     { fontSize: 16, fontWeight: '900', color: Colors.green },
  bidCover:      { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
  acceptBtn:     { marginTop: 10, backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  acceptBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  acceptedBadge: { marginTop: 8, backgroundColor: '#dcfce7', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  acceptedText:  { color: Colors.green, fontWeight: '700', fontSize: 13 },
  footer:        { padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
  bidBtn:        { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bidBtnText:    { color: 'white', fontWeight: '800', fontSize: 16 },
  modalSafe:     { flex: 1, backgroundColor: Colors.white },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:    { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody:     { padding: 20 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  fieldInput:    { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  btn:           { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:       { color: 'white', fontWeight: '800', fontSize: 16 },
});
