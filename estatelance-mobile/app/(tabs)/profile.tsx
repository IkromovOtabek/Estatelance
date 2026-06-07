import React, { useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import SwipeWrapper from '../../components/SwipeWrapper';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Image, Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@apollo/client';
// expo-image-picker Expo Go'da bo'lmasligi mumkin — xavfsiz yuklash
let ImagePicker: any = null;
try { ImagePicker = require('expo-image-picker'); } catch {}
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { safeImageUri } from '../../libs/safeImage';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/Toast';
import { UPDATE_PROFILE } from '../../apollo/mutations';
import { GET_ME } from '../../apollo/queries';
import MapPickerModal, { PickedAddress } from '../../components/MapPickerModal';

const AVAIL_OPTIONS = [
  { value: 'AVAILABLE',    label: 'Band emas',      icon: 'checkmark-circle-outline',  color: '#16a34a' },
  { value: 'BUSY',         label: 'Band',           icon: 'close-circle-outline',      color: '#dc2626' },
  { value: 'OPEN_TO_WORK', label: 'Ish izlayapman', icon: 'eye-outline',               color: '#0891b2' },
];

export default function ProfileScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    safe:               { flex: 1, backgroundColor: Colors.bg },
    profileTop:         { alignItems: 'center', paddingTop: 24, paddingBottom: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    avatar:             { width: 110, height: 110, borderRadius: 55, marginBottom: 12, borderWidth: 3, borderColor: Colors.primary },
    avatarFallback:     { width: 110, height: 110, borderRadius: 55, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 3, borderColor: Colors.primary },
    avatarText:         { fontSize: 40, fontWeight: '900', color: Colors.primary },
    name:               { fontSize: 22, fontWeight: '900', color: Colors.text },
    username:           { fontSize: 14, color: Colors.textSub, marginTop: 2 },
    userTitle:          { fontSize: 14, color: Colors.textSub, marginTop: 4 },
    typeBadge:          { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
    agentBadge:         { backgroundColor: '#e0f2fe' },
    freelancerBadge:    { backgroundColor: '#f5f3ff' },
    typeText:           { fontSize: 13, fontWeight: '700' },
    companyImg:         { width: '100%', height: 160, borderRadius: 10 },
    statsRow:           { flexDirection: 'row', gap: 12, padding: 16 },
    statCard:           { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
    statValue:          { fontSize: 22, fontWeight: '900', color: Colors.primary },
    statLabel:          { fontSize: 12, color: Colors.textSub, marginTop: 4, textAlign: 'center' },
    section:            { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
    sectionTitle:       { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    bioText:            { fontSize: 14, color: Colors.textSub, lineHeight: 20 },
    skillsWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip:          { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
    skillText:          { fontSize: 13, color: Colors.textSub },
    availChip:          { backgroundColor: Colors.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
    availText:          { fontSize: 14, fontWeight: '600', color: Colors.text },
    hamburgerBtn:       { position: 'absolute', top: 12, right: 16, zIndex: 10, width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    settingsHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
    settingsBackBtn:    { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    settingsTitle:      { fontSize: 17, fontWeight: '800', color: Colors.text },
    settingsGroup:      { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
    settingsRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 15 },
    settingsRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
    settingsRowText:    { flex: 1, fontSize: 15, color: Colors.text },
    settingsRowValue:   { fontSize: 14, color: Colors.textMuted, marginRight: 6 },
    statusSection:      { marginHorizontal: 16, marginBottom: 12 },
    statusTitle:        { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    statusRow:          { flexDirection: 'row', gap: 8 },
    statusBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
    statusBtnText:      { fontSize: 12, fontWeight: '700', color: Colors.textSub },
    btnsSection:        { padding: 16, gap: 10 },
    myWorksBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0891b2', borderRadius: 14, paddingVertical: 14 },
    myWorksBtnText:     { color: 'white', fontWeight: '800', fontSize: 16 },
    editBtn:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14 },
    editBtnText:        { color: 'white', fontWeight: '800', fontSize: 16 },
    logoutBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: '#fecaca' },
    logoutText:         { color: Colors.red, fontWeight: '700', fontSize: 15 },
    modalSafe:          { flex: 1, backgroundColor: Colors.white },
    modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
    modalTitle:         { fontSize: 18, fontWeight: '800', color: Colors.text },
    modalBody:          { padding: 20 },
    fieldLabel:         { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
    fieldInput:         { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
    mapPickerBtn:       { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: Colors.bg, marginBottom: 14 },
    mapPickerText:      { flex: 1, fontSize: 15, color: Colors.textMuted },
    imgPickerBtn:       { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 8, height: 140 },
    companyImgPreview:  { width: '100%', height: '100%' },
    imgPickerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.bg },
    imgPickerHint:      { fontSize: 14, color: Colors.textMuted },
    removeImgBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
    radioBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border },
    radioBtnActive:     { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
    radioText:          { fontSize: 14, fontWeight: '600', color: Colors.textSub },
    btn:                { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    btnText:            { color: 'white', fontWeight: '800', fontSize: 16 },
  }), [themeKey]);
  const { user, login, logout } = useAuth();
  const { show: showToast } = useToast();
  const [editModal, setEditModal]       = useState(false);
  const [mapModal, setMapModal]         = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);

  const { data: meData, loading: meLoading } = useQuery(GET_ME, { fetchPolicy: 'cache-and-network', skip: !user });

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }} edges={['top']}>
        <Ionicons name="person-circle-outline" size={72} color={Colors.textMuted} />
        <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 8 }}>Kirish talab etiladi</Text>
        <Text style={{ fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>
          Profilingizni ko'rish uchun tizimga kiring
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 }}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Kirish</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  const profile = meData?.getMyProfile ?? user;

  const [eName, setEName]           = useState('');
  const [eBio, setEBio]             = useState('');
  const [eCategory, setECategory]   = useState('');
  const [eRate, setERate]           = useState('');
  const [eAvail, setEAvail]         = useState('AVAILABLE');
  const [eSkills, setESkills]       = useState('');
  const [eAddress, setEAddress]     = useState<PickedAddress | null>(null);
  const [eCompanyImg, setECompanyImg] = useState('');

  const [updateProfile, { loading: saving }] = useMutation(UPDATE_PROFILE);

  const isAgent = (user?.userType ?? profile?.userType) === 'AGENT';

  const changeStatus = async (value: string) => {
    setStatusLoading(true);
    try {
      const { data } = await updateProfile({ variables: { input: { availability: value } } });
      await login({ ...user!, ...data.updateProfile });
      const labels: Record<string, string> = { AVAILABLE: 'Band emas', BUSY: 'Band', OPEN_TO_WORK: 'Ish izlayapman' };
      showToast({ message: `Status: ${labels[value] ?? value}`, type: 'info' });
    } catch {}
    setStatusLoading(false);
  };

  const openEdit = () => {
    setEName(profile?.fullName ?? '');
    setEBio(profile?.bio ?? '');
    setECategory(profile?.freelancerCategory ?? '');
    setERate(String(profile?.hourlyRate ?? ''));
    setEAvail(profile?.availability ?? 'AVAILABLE');
    setESkills((profile?.skills ?? []).join(', '));
    setEAddress(profile?.address ?? null);
    setECompanyImg(profile?.companyImage ?? '');
    setEditModal(true);
  };

  const pickCompanyImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Mavjud emas', "Bu funksiya Expo Go'da ishlamaydi. To'liq ilovada (development build) ishlaydi.");
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Galereya ruxsati berilmadi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = `data:image/jpeg;base64,${asset.base64}`;
      setECompanyImg(base64);
    }
  };

  const handleSave = async () => {
    try {
      const { data } = await updateProfile({
        variables: {
          input: {
            fullName: eName.trim() || undefined,
            bio: eBio.trim() || undefined,
            freelancerCategory: eCategory.trim() || undefined,
            hourlyRate: eRate ? parseFloat(eRate) : undefined,
            availability: eAvail,
            skills: eSkills.split(',').map(s => s.trim()).filter(Boolean),
            address: eAddress ? {
              latitude: eAddress.latitude,
              longitude: eAddress.longitude,
              name: eAddress.name,
            } : undefined,
            companyImage: isAgent ? (eCompanyImg || undefined) : undefined,
          },
        },
      });
      await login({ ...user!, ...data.updateProfile });
      setEditModal(false);
      showToast({ message: 'Profil muvaffaqiyatli saqlandi', type: 'success' });
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: '← Ortga', style: 'cancel' },
      { text: 'Chiqish', style: 'destructive', onPress: logout },
    ]);
  };

  const initials = (profile?.fullName ?? profile?.username ?? '?')[0].toUpperCase();

  return (<SwipeWrapper>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hamburger */}
        <TouchableOpacity style={styles.hamburgerBtn} onPress={() => router.push('/settings' as any)}>
          <Ionicons name="menu" size={26} color={Colors.text} />
        </TouchableOpacity>

        {/* Avatar + name */}
        <View style={styles.profileTop}>
          {safeImageUri(profile?.profileImage) ? (
            <Image
              source={{ uri: safeImageUri(profile?.profileImage) }}
              style={styles.avatar}
              onError={() => {}}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.fullName ?? profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
          {profile?.freelancerCategory && <Text style={styles.userTitle}>{profile.freelancerCategory}</Text>}

          <View style={[styles.typeBadge, isAgent ? styles.agentBadge : styles.freelancerBadge]}>
            <Ionicons
              name={isAgent ? 'business-outline' : 'briefcase-outline'}
              size={13}
              color={isAgent ? '#0891b2' : '#7c3aed'}
            />
            <Text style={[styles.typeText, isAgent ? { color: '#0891b2' } : { color: '#7c3aed' }]}>
              {isAgent ? 'Agent' : 'Freelancer'}
            </Text>
          </View>
        </View>

        {/* Company image (agent only) */}
        {isAgent && safeImageUri(profile?.companyImage) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kompaniya rasmi</Text>
            <Image source={{ uri: safeImageUri(profile?.companyImage) }} style={styles.companyImg} resizeMode="cover" />
          </View>
        ) : null}

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

        {/* Status tanlash */}
        <View style={styles.statusSection}>
          <Text style={styles.statusTitle}>Status</Text>
          <View style={styles.statusRow}>
            {AVAIL_OPTIONS.map(opt => {
              const active = (profile?.availability ?? 'AVAILABLE') === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.statusBtn, active && { backgroundColor: opt.color, borderColor: opt.color }]}
                  onPress={() => changeStatus(opt.value)}
                  disabled={statusLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={14}
                    color={active ? 'white' : opt.color}
                  />
                  <Text style={[styles.statusBtnText, active && { color: 'white' }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Address */}
        {profile?.address && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manzil</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="location-outline" size={16} color={Colors.primary} />
              <Text style={styles.bioText}>
                {profile.address.name
                  ? profile.address.name
                  : `${profile.address.latitude.toFixed(5)}, ${profile.address.longitude.toFixed(5)}`}
              </Text>
            </View>
          </View>
        )}

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


        {/* Buttons */}
        <View style={styles.btnsSection}>
          <TouchableOpacity style={styles.myWorksBtn} onPress={() => router.push('/(tabs)/my-works')}>
            <Ionicons name="folder-open" size={18} color="white" />
            <Text style={styles.myWorksBtnText}>Mening Ishlarim</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
            <Ionicons name="pencil" size={16} color="white" />
            <Text style={styles.editBtnText}>Profilni tahrirlash</Text>
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

            {!isAgent && (
              <>
                <Text style={styles.fieldLabel}>Kategoriya</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={eCategory}
                  onChangeText={setECategory}
                  placeholder="Masalan: PHOTOGRAPHY"
                  placeholderTextColor={Colors.textMuted}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.fieldInput, { height: 100, textAlignVertical: 'top' }]}
              value={eBio}
              onChangeText={setEBio}
              multiline
              placeholder="O'zingiz haqingizda..."
              placeholderTextColor={Colors.textMuted}
            />

            {/* Manzil */}
            <Text style={styles.fieldLabel}>Manzil</Text>
            <TouchableOpacity
              style={styles.mapPickerBtn}
              onPress={() => setMapModal(true)}
            >
              <Ionicons name="map-outline" size={18} color={Colors.primary} />
              <Text style={[styles.mapPickerText, eAddress && { color: Colors.text }]}>
                {eAddress?.name
                  ? eAddress.name
                  : eAddress
                    ? `${eAddress.latitude.toFixed(5)}, ${eAddress.longitude.toFixed(5)}`
                    : 'Xaritadan manzil tanlash'}
              </Text>
              {eAddress && (
                <TouchableOpacity onPress={() => setEAddress(null)}>
                  <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Kompaniya rasmi — faqat agent uchun */}
            {isAgent && (
              <>
                <Text style={styles.fieldLabel}>Kompaniya rasmi (ixtiyoriy)</Text>
                <TouchableOpacity style={styles.imgPickerBtn} onPress={pickCompanyImage}>
                  {safeImageUri(eCompanyImg) ? (
                    <Image source={{ uri: safeImageUri(eCompanyImg) }} style={styles.companyImgPreview} resizeMode="cover" />
                  ) : (
                    <View style={styles.imgPickerPlaceholder}>
                      <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
                      <Text style={styles.imgPickerHint}>Rasm tanlash</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {eCompanyImg ? (
                  <TouchableOpacity onPress={() => setECompanyImg('')} style={styles.removeImgBtn}>
                    <Ionicons name="trash-outline" size={15} color={Colors.red} />
                    <Text style={{ color: Colors.red, fontSize: 13, fontWeight: '600' }}>Rasmni o'chirish</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}

            {!isAgent && (
              <>
                <Text style={styles.fieldLabel}>Soatlik narx ($)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={eRate}
                  onChangeText={setERate}
                  keyboardType="numeric"
                  placeholder="15"
                  placeholderTextColor={Colors.textMuted}
                />

                <Text style={styles.fieldLabel}>Ko'nikmalar (vergul bilan)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={eSkills}
                  onChangeText={setESkills}
                  placeholder="AutoCAD, 3ds Max, Photoshop"
                  placeholderTextColor={Colors.textMuted}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Bandlik holati</Text>
            <View style={{ gap: 8, marginBottom: 20 }}>
              {AVAIL_OPTIONS.map(o => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.radioBtn, eAvail === o.value && styles.radioBtnActive]}
                  onPress={() => setEAvail(o.value)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={o.icon as any} size={15} color={eAvail === o.value ? o.color : Colors.textSub} />
                    <Text style={[styles.radioText, eAvail === o.value && { color: o.color }]}>{o.label}</Text>
                  </View>
                  {eAvail === o.value && <Ionicons name="checkmark-circle" size={18} color={o.color} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.btn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Saqlash</Text>}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Map Picker */}
      <MapPickerModal
        visible={mapModal}
        initial={eAddress}
        onConfirm={(addr) => { setEAddress(addr); setMapModal(false); }}
        onClose={() => setMapModal(false)}
      />

    </SafeAreaView>
  </SwipeWrapper>);
}

