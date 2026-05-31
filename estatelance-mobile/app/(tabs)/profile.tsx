import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@apollo/client';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { UPDATE_PROFILE } from '../../apollo/mutations';
import { GET_ME } from '../../apollo/queries';

const AVAIL_OPTIONS = [
  { value: 'AVAILABLE',    label: '✅ Band emas' },
  { value: 'BUSY',         label: '🔴 Band' },
  { value: 'OPEN_TO_WORK', label: '👀 Ish izlayapman' },
];

export default function ProfileScreen() {
  const { user, login, logout } = useAuth();
  const [editModal, setEditModal] = useState(false);

  // Serverdan yangi ma'lumot olish
  const { data: meData, loading: meLoading } = useQuery(GET_ME, { fetchPolicy: 'cache-and-network' });
  const profile = meData?.getMe ?? user;

  const [eName, setEName]       = useState('');
  const [eBio, setEBio]         = useState('');
  const [eTitle, setETitle]     = useState('');
  const [eRate, setERate]       = useState('');
  const [eAvail, setEAvail]     = useState('AVAILABLE');
  const [eSkills, setESkills]   = useState('');

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE);

  const handleSave = async () => {
    try {
      const { data } = await updateProfile({
        variables: { input: {
          fullName: eName.trim() || undefined,
          bio: eBio.trim() || undefined,
          title: eTitle.trim() || undefined,
          hourlyRate: eRate ? parseFloat(eRate) : undefined,
          availability: eAvail,
          skills: eSkills.split(',').map(s => s.trim()).filter(Boolean),
        }},
      });
      await login({ ...user!, ...data.updateProfile });
      setEditModal(false);
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (profile?.fullName ?? profile?.username ?? '?')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.profileTop}>
          {profile?.profileImage ? (
            <Image source={{ uri: profile.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.fullName ?? profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.title && <Text style={styles.userTitle}>{profile.title}</Text>}

          {/* Type badge */}
          <View style={[styles.typeBadge, user?.userType === 'AGENT' ? styles.agentBadge : styles.freelancerBadge]}>
            <Text style={[styles.typeText, user?.userType === 'AGENT' ? { color: '#0891b2' } : { color: '#7c3aed' }]}>
              {user?.userType === 'AGENT' ? '🏢 Mijoz' : '💼 Frilanser'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Bajarilgan ish', value: profile?.completedJobCount ?? 0 },
            { label: 'Soatlik narx',   value: profile?.hourlyRate ? `$${profile.hourlyRate}` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {profile?.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ko'nikmalar</Text>
            <View style={styles.skillsWrap}>
              {profile.skills.map((s: string) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Holat</Text>
          <View style={styles.availChip}>
            <Text style={styles.availText}>
              {AVAIL_OPTIONS.find(o => o.value === profile?.availability)?.label ?? '—'}
            </Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.btnsSection}>
          <TouchableOpacity style={styles.myWorksBtn} onPress={() => router.push('/(tabs)/my-works')}>
            <Ionicons name="folder-open" size={18} color="white" />
            <Text style={styles.myWorksBtnText}>Mening Ishlarim</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editBtn} onPress={() => {
            setEName(profile?.fullName ?? '');
            setEBio(profile?.bio ?? '');
            setETitle(profile?.title ?? '');
            setERate(String(profile?.hourlyRate ?? ''));
            setEAvail(profile?.availability ?? 'AVAILABLE');
            setESkills((profile?.skills ?? []).join(', '));
            setEditModal(true);
          }}>
            <Ionicons name="pencil" size={16} color="white" />
            <Text style={styles.editBtnText}>Profilni tahrirlash</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.red} />
            <Text style={styles.logoutText}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={editModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Profilni tahrirlash</Text>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>To'liq ism</Text>
            <TextInput style={styles.fieldInput} value={eName} onChangeText={setEName} />

            <Text style={styles.fieldLabel}>Mutaxassislik sarlavhasi</Text>
            <TextInput style={styles.fieldInput} value={eTitle} onChangeText={setETitle} placeholder="Masalan: 3D Dizayner" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]} value={eBio} onChangeText={setEBio} multiline placeholder="O'zingiz haqingizda..." placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Soatlik narx ($)</Text>
            <TextInput style={styles.fieldInput} value={eRate} onChangeText={setERate} keyboardType="numeric" placeholder="15" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Ko'nikmalar (vergul bilan)</Text>
            <TextInput style={styles.fieldInput} value={eSkills} onChangeText={setESkills} placeholder="AutoCAD, 3ds Max, Photoshop" placeholderTextColor={Colors.textMuted} />

            <Text style={styles.fieldLabel}>Bandlik holati</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {AVAIL_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.radioBtn, eAvail === o.value && styles.radioBtnActive]}
                  onPress={() => setEAvail(o.value)}
                >
                  <Text style={[styles.radioText, eAvail === o.value && { color: Colors.primary }]}>{o.label}</Text>
                  {eAvail === o.value && <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Saqlash</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  profileTop:      { alignItems: 'center', paddingTop: 24, paddingBottom: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:          { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarFallback:  { width: 90, height: 90, borderRadius: 45, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:      { fontSize: 34, fontWeight: '900', color: Colors.primary },
  name:            { fontSize: 22, fontWeight: '900', color: Colors.text },
  username:        { fontSize: 14, color: Colors.textSub, marginTop: 2 },
  userTitle:       { fontSize: 14, color: Colors.textSub, marginTop: 4 },
  typeBadge:       { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  agentBadge:      { backgroundColor: '#e0f2fe' },
  freelancerBadge: { backgroundColor: '#f5f3ff' },
  typeText:        { fontSize: 13, fontWeight: '700' },
  statsRow:        { flexDirection: 'row', gap: 12, padding: 16 },
  statCard:        { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue:       { fontSize: 22, fontWeight: '900', color: Colors.primary },
  statLabel:       { fontSize: 12, color: Colors.textSub, marginTop: 4, textAlign: 'center' },
  section:         { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle:    { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  bioText:         { fontSize: 14, color: Colors.textSub, lineHeight: 20 },
  skillsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:       { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  skillText:       { fontSize: 13, color: Colors.textSub },
  availChip:       { backgroundColor: Colors.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  availText:       { fontSize: 14, fontWeight: '600', color: Colors.text },
  btnsSection:     { padding: 16, gap: 10 },
  myWorksBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0891b2', borderRadius: 14, paddingVertical: 14 },
  myWorksBtnText:  { color: 'white', fontWeight: '800', fontSize: 16 },
  editBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14 },
  editBtnText:     { color: 'white', fontWeight: '800', fontSize: 16 },
  logoutBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#fecaca' },
  logoutText:      { color: Colors.red, fontWeight: '700', fontSize: 15 },
  modalSafe:       { flex: 1, backgroundColor: Colors.white },
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:      { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody:       { padding: 20 },
  fieldLabel:      { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  fieldInput:      { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  radioBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
  radioBtnActive:  { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  radioText:       { fontSize: 14, fontWeight: '600', color: Colors.textSub },
  btn:             { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:         { color: 'white', fontWeight: '800', fontSize: 16 },
});
