import React, { useState, useMemo } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/Toast';
import { UPDATE_PROFILE, DELETE_MY_ACCOUNT } from '../apollo/mutations';

const LANGUAGES = ['O\'zbekcha', 'Русский', 'English'];
const THEMES    = ['Tizim', 'Yorug\'', 'Qorang\'u'];

export default function SettingsScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => createStyles(), [themeKey]);
  const { user, login, logout } = useAuth();
  const { show: showToast } = useToast();

  const [langModal,    setLangModal]    = useState(false);
  const [themeModal,   setThemeModal]   = useState(false);
  const [phoneModal,   setPhoneModal]   = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [phone, setPhone]               = useState(user?.phoneNumber ?? '');
  const [lang,  setLang]                = useState('O\'zbekcha');
  const [theme, setTheme]               = useState('Tizim');

  const [updateProfile, { loading: saving }]   = useMutation(UPDATE_PROFILE);
  const [deleteAccount, { loading: deleting }] = useMutation(DELETE_MY_ACCOUNT);

  const savePhone = async () => {
    if (!phone.trim()) return;
    try {
      const { data } = await updateProfile({ variables: { input: { phoneNumber: phone.trim() } } });
      await login({ ...user!, ...data.updateProfile });
      setPhoneModal(false);
      showToast({ message: 'Telefon raqam saqlandi', type: 'success' });
    } catch {
      showToast({ message: 'Xato yuz berdi', type: 'error' });
    }
  };

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Tizimdan chiqmoqchimisiz?', [
      { text: '← Ortga', style: 'cancel' },
      {
        text: 'Chiqish', style: 'destructive',
        onPress: () => { logout(); router.replace('/(tabs)'); },
      },
    ]);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch {}
    setDeleteModal(false);
    await logout();
    router.replace('/(tabs)');
    showToast({ message: "Akkaunt o'chirildi", type: 'info' });
  };

  const handleDeleteAccount = () => {
    setDeleteModal(true);
    // eski alert o'chirildi — custom modal ishlatiladi
    if (false) Alert.alert(
      '',
      '',
      []
    );
  };

  const groups = [
    {
      title: 'Hisob',
      items: [
        {
          icon: 'person-circle-outline',
          label: 'Foydalanuvchi',
          value: user?.fullName ?? user?.username,
          onPress: () => { router.back(); },
        },
        {
          icon: 'call-outline',
          label: "Telefon raqam",
          value: user?.phoneNumber ?? "Qo'shilmagan",
          onPress: () => { setPhone(user?.phoneNumber ?? ''); setPhoneModal(true); },
        },
        {
          icon: 'notifications-outline',
          label: 'Bildirishnomalar',
          onPress: () => router.push('/(tabs)/notifications' as any),
        },
        {
          icon: 'trash-outline',
          label: "Akkauntni o'chirish",
          isRed: true,
          onPress: handleDeleteAccount,
        },
      ],
    },
    {
      title: 'Platforma',
      items: [
        {
          icon: 'briefcase-outline',
          label: 'Mening ishlarim',
          onPress: () => { router.back(); setTimeout(() => router.push('/(tabs)/my-works' as any), 150); },
        },
        {
          icon: 'heart-outline',
          label: 'Sevimlilar',
          onPress: () => { router.back(); setTimeout(() => router.push('/(tabs)/favorites' as any), 150); },
        },
        {
          icon: 'eye-off-outline',
          label: 'Yashirilgan ishlar',
          onPress: () => showToast({ message: 'Tez orada qo\'shiladi', type: 'info' }),
        },
      ],
    },
    {
      title: 'Ilova',
      items: [
        {
          icon: 'language-outline',
          label: 'Til',
          value: lang,
          onPress: () => setLangModal(true),
        },
        {
          icon: 'color-palette-outline',
          label: 'Interfeys temasi',
          value: theme,
          onPress: () => router.push('/theme-select' as any),
        },
        {
          icon: 'log-out-outline',
          label: 'Chiqish',
          isRed: true,
          onPress: handleLogout,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Sozlamalar</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.group}>
              {group.items.map((item, i) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, i < group.items.length - 1 && styles.rowBorder]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrap, item.isRed && { backgroundColor: '#fee2e2' }]}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.isRed ? Colors.red : Colors.primary}
                    />
                  </View>
                  <Text style={[styles.rowText, item.isRed && { color: Colors.red }]}>
                    {item.label}
                  </Text>
                  {(item as any).value && (
                    <Text style={styles.rowValue} numberOfLines={1}>{(item as any).value}</Text>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={17}
                    color={item.isRed ? Colors.red : Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── Akkaunt o'chirish modal ── */}
      <Modal visible={deleteModal} transparent animationType="fade" onRequestClose={() => setDeleteModal(false)}>
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteCard}>
            {/* Icon */}
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning" size={36} color="#ef4444" />
            </View>

            <Text style={styles.deleteTitle}>Haqiqatan o'chirishni xohlaysizmi?</Text>
            <Text style={styles.deleteDesc}>
              Akkauntni o'chirsangiz platformadan akkauntingiz butkul o'chadi!{'\n'}
              Barcha ma'lumotlar, ishlar va xabarlar yo'qoladi.
            </Text>

            <TouchableOpacity
              style={[styles.deleteConfirmBtn, deleting && { opacity: 0.7 }]}
              onPress={confirmDeleteAccount}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator color="white" />
                : <Text style={styles.deleteConfirmText}>Ha, o'chirish</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteCancelBtn}
              onPress={() => setDeleteModal(false)}
              disabled={deleting}
            >
              <Text style={styles.deleteCancelText}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Telefon modal */}
      <Modal visible={phoneModal} transparent animationType="slide" onRequestClose={() => setPhoneModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPhoneModal(false)} />
          <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Telefon raqam</Text>
            <TouchableOpacity onPress={() => setPhoneModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+998 90 123 45 67"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            autoFocus
          />
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={savePhone}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="white" />
              : <Text style={styles.saveBtnText}>Saqlash</Text>
            }
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Til modal */}
      <Modal visible={langModal} transparent animationType="slide" onRequestClose={() => setLangModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setLangModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Tilni tanlang</Text>
            <TouchableOpacity onPress={() => setLangModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {LANGUAGES.map(l => (
            <TouchableOpacity
              key={l}
              style={styles.optionRow}
              onPress={() => { setLang(l); setLangModal(false); showToast({ message: `Til: ${l}`, type: 'success' }); }}
            >
              <Text style={styles.optionText}>{l}</Text>
              {lang === l && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Tema modal */}
      <Modal visible={themeModal} transparent animationType="slide" onRequestClose={() => setThemeModal(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setThemeModal(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Temani tanlang</Text>
            <TouchableOpacity onPress={() => setThemeModal(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {THEMES.map(t => (
            <TouchableOpacity
              key={t}
              style={styles.optionRow}
              onPress={() => { setTheme(t); setThemeModal(false); showToast({ message: `Tema: ${t}`, type: 'success' }); }}
            >
              <Text style={styles.optionText}>{t}</Text>
              {theme === t && <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = () => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:     { width: 38, height: 38, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 17, fontWeight: '800', color: Colors.text },
  body:        { padding: 16, gap: 6 },
  groupTitle:  { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, marginTop: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  group:       { backgroundColor: Colors.white, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: 4 },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder:   { borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  rowText:     { flex: 1, fontSize: 15, color: Colors.text },
  rowValue:    { fontSize: 13, color: Colors.textMuted, maxWidth: 120, marginRight: 4 },
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:       { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 18, fontWeight: '800', color: Colors.text },
  closeBtn:    { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  input:       { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 16 },
  saveBtn:     { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 16 },
  optionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionText:  { fontSize: 16, color: Colors.text },
  deleteOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  deleteCard:         { backgroundColor: Colors.white, borderRadius: 24, padding: 28, alignItems: 'center', width: '100%' },
  deleteIconWrap:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  deleteTitle:        { fontSize: 18, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 10 },
  deleteDesc:         { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  deleteConfirmBtn:   { width: '100%', backgroundColor: '#ef4444', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  deleteConfirmText:  { color: 'white', fontWeight: '800', fontSize: 16 },
  deleteCancelBtn:    { width: '100%', backgroundColor: Colors.bg, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  deleteCancelText:   { color: Colors.textSub, fontWeight: '700', fontSize: 16 },
});
