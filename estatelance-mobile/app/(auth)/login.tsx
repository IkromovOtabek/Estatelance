import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useApolloClient } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { LOGIN, CREATE_TELEGRAM_AUTH_TOKEN, CREATE_GOOGLE_AUTH_TOKEN } from '../../apollo/mutations';
import { CHECK_TELEGRAM_AUTH_TOKEN, CHECK_GOOGLE_AUTH_TOKEN, GET_ME } from '../../apollo/queries';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 120000;
const TG_USER_KEY      = 'lastTgUser';

interface SavedTgUser { name: string; photo?: string; }

export default function LoginScreen() {
  const { login } = useAuth();
  const client    = useApolloClient();

  const [username, setUsername]           = useState('');
  const [password, setPassword]           = useState('');
  const [tgLoading, setTgLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [waitingFor, setWaitingFor]       = useState<'idle' | 'telegram' | 'google'>('idle');
  const [savedTg, setSavedTg]             = useState<SavedTgUser | null>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loginMutation, { loading }] = useMutation(LOGIN);
  const [createToken]                = useMutation(CREATE_TELEGRAM_AUTH_TOKEN);
  const [createGoogleToken]          = useMutation(CREATE_GOOGLE_AUTH_TOKEN);

  useEffect(() => {
    AsyncStorage.getItem(TG_USER_KEY).then(val => {
      if (val) setSavedTg(JSON.parse(val));
    });
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current = null; timeoutRef.current = null;
  };

  const saveAndLogin = async (user: any, waitType: 'telegram' | 'google') => {
    stopPolling();
    setWaitingFor('idle');
    await AsyncStorage.setItem(TG_USER_KEY, JSON.stringify({
      name:  user.fullName ?? user.username,
      photo: user.profileImage ?? null,
    }));
    await login(user);
    if (user.needsOnboarding) router.replace('/(auth)/onboarding');
    else router.replace('/(tabs)');
  };

  // ─── Tez kirish (saqlangan token) ────────────────────────────────────────
  const handleQuickLogin = async () => {
    setTgLoading(true);
    try {
      const token = await AsyncStorage.getItem('rememberedToken');
      if (!token) { setTgLoading(false); handleTelegramAuth(); return; }
      const { data } = await client.query({
        query: GET_ME, fetchPolicy: 'network-only',
        context: { headers: { authorization: `Bearer ${token}` } },
      });
      if (data?.getMyProfile) {
        await AsyncStorage.setItem('accessToken', token);
        await login({ ...data.getMyProfile, accessToken: token });
        setTgLoading(false);
        router.replace('/(tabs)');
      } else {
        setTgLoading(false);
        handleTelegramAuth();
      }
    } catch {
      setTgLoading(false);
      handleTelegramAuth();
    }
  };

  // ─── Google Auth ──────────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    try {
      // 1. Token yaratamiz
      const { data } = await createGoogleToken();
      const token: string = data.createGoogleAuthToken;

      // 2. Mobile-init: state bilan Google URL olamiz
      const initRes = await fetch(
        `https://api.bufu.uz/auth/google/mobile-url?mob=${token}`
      );
      const { url } = await initRes.json();

      setGoogleLoading(false);
      setWaitingFor('google');
      startPoll(token, 'google');

      // 3. Ilova ichida Google oynasi
      await WebBrowser.openAuthSessionAsync(url, 'bufu://');
    } catch (e: any) {
      setGoogleLoading(false);
      setWaitingFor('idle');
      stopPolling();
      Alert.alert('Xato', e?.message ?? 'Google kirish xatosi');
    }
  };

  // ─── Telegram Auth ────────────────────────────────────────────────────────
  const handleTelegramAuth = async () => {
    setTgLoading(true);
    try {
      const { data } = await createToken();
      const token: string = data.createTelegramAuthToken;
      await Linking.openURL(`https://t.me/buildfuture_bot?start=tgauth_${token}`);
      setWaitingFor('telegram');
      setTgLoading(false);
      startPoll(token, 'telegram');
    } catch (e: any) {
      setTgLoading(false);
      Alert.alert('Xato', e?.message ?? 'Token yaratishda xato');
    }
  };

  // ─── Polling (Telegram va Google uchun umumiy) ────────────────────────────
  const startPoll = (token: string, type: 'telegram' | 'google') => {
    stopPolling();

    const query     = type === 'google' ? CHECK_GOOGLE_AUTH_TOKEN : CHECK_TELEGRAM_AUTH_TOKEN;
    const dataKey   = type === 'google' ? 'checkGoogleAuthToken' : 'checkTelegramAuthToken';

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.query({
          query, variables: { token }, fetchPolicy: 'network-only',
        });
        const user = data?.[dataKey];
        if (user?.accessToken) await saveAndLogin(user, type);
      } catch { /* davom etadi */ }
    }, POLL_INTERVAL_MS);

    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setWaitingFor('idle');
      Alert.alert('Vaqt tugadi', `${type === 'google' ? 'Google' : 'Telegram'} orqali kirish amalga oshmadi.`);
    }, POLL_TIMEOUT_MS);
  };

  const cancelWaiting = () => { stopPolling(); setWaitingFor('idle'); };

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Xato', 'Username va parolni kiriting'); return;
    }
    try {
      const { data } = await loginMutation({
        variables: { input: { username: username.trim(), password } },
      });
      await login(data.login);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Kirish xatosi', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  // ─── Telegram tugmasi ─────────────────────────────────────────────────────
  const renderTelegramButton = () => {
    if (tgLoading) return (
      <TouchableOpacity style={styles.tgBtn} disabled>
        <ActivityIndicator color="white" size="small" />
        <Text style={styles.tgBtnText}>Yuklanmoqda...</Text>
      </TouchableOpacity>
    );

    if (savedTg) {
      const initials = savedTg.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
      return (
        <>
          <TouchableOpacity style={styles.tgBtnPersonal} onPress={handleQuickLogin} activeOpacity={0.85}>
            <View style={styles.tgAvatar}>
              {savedTg.photo
                ? <Image source={{ uri: savedTg.photo }} style={styles.tgAvatarImg} />
                : <View style={styles.tgAvatarFallback}><Text style={styles.tgAvatarText}>{initials}</Text></View>
              }
            </View>
            <Text style={styles.tgBtnPersonalText}>
              Kirish: <Text style={{ fontWeight: '900' }}>{savedTg.name.split(' ')[0]}</Text>
            </Text>
            <Ionicons name="paper-plane" size={18} color="white" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tgOtherBtn} onPress={() => {
            setSavedTg(null);
            AsyncStorage.removeItem(TG_USER_KEY);
            handleTelegramAuth();
          }}>
            <Text style={styles.tgOtherText}>Boshqa Telegram akkaunt</Text>
          </TouchableOpacity>
        </>
      );
    }

    return (
      <TouchableOpacity style={styles.tgBtn} onPress={handleTelegramAuth} activeOpacity={0.85}>
        <Ionicons name="paper-plane" size={20} color="white" />
        <Text style={styles.tgBtnText}>Telegram orqali kirish</Text>
      </TouchableOpacity>
    );
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoBox}>
          <Image source={require('../../assets/bufu-logo.png')} style={styles.logo} resizeMode="cover" />
          <Text style={styles.appName}>BuFu</Text>
          <Text style={styles.tagline}>Frilanserlar platformasi</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Kirish</Text>

          {waitingFor !== 'idle' ? (
            <View style={styles.waitBox}>
              <ActivityIndicator
                color={waitingFor === 'google' ? '#4285F4' : '#0088cc'}
                size="large" style={{ marginBottom: 16 }}
              />
              <Text style={styles.waitTitle}>
                {waitingFor === 'google' ? 'Google ni kutmoqda...' : 'Telegramni kutmoqda...'}
              </Text>
              <Text style={styles.waitDesc}>
                {waitingFor === 'google'
                  ? 'Google hisobingizga kirgandan so\'ng ilova avtomatik davom etadi'
                  : '@buildfuture_bot da "📱 BuFu ga kirish" tugmasini bosing'}
              </Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelWaiting}>
                <Text style={styles.cancelText}>Bekor qilish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {renderTelegramButton()}

              <TouchableOpacity
                style={[styles.googleBtn, googleLoading && { opacity: 0.7 }]}
                onPress={handleGoogleAuth}
                disabled={googleLoading || tgLoading || loading}
                activeOpacity={0.85}
              >
                {googleLoading
                  ? <ActivityIndicator size="small" color="#4285F4" />
                  : <View style={styles.googleIcon}><Text style={styles.googleIconText}>G</Text></View>
                }
                <Text style={styles.googleBtnText}>
                  {googleLoading ? 'Yuklanmoqda...' : 'Google orqali kirish'}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>yoki</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input} placeholder="username"
                placeholderTextColor={Colors.textMuted}
                value={username} onChangeText={setUsername}
                autoCapitalize="none" autoCorrect={false}
              />

              <Text style={styles.label}>Parol</Text>
              <TextInput
                style={styles.input} placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password} onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.7 }]}
                onPress={handleLogin} disabled={loading}
              >
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Kirish</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.linkText}>
                  Akkount yo'qmi?{' '}
                  <Text style={{ color: Colors.primary, fontWeight: '700' }}>Ro'yxatdan o'tish</Text>
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:         { flexGrow: 1, backgroundColor: Colors.bg, padding: 20, justifyContent: 'center' },
  logoBox:           { alignItems: 'center', marginBottom: 32 },
  logo:              { width: 80, height: 80, borderRadius: 22, marginBottom: 12 },
  appName:           { fontSize: 26, fontWeight: '900', color: Colors.text },
  tagline:           { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  card:              { backgroundColor: Colors.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  title:             { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  tgBtn:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0088cc', borderRadius: 12, paddingVertical: 14, marginBottom: 4 },
  tgBtnText:         { color: 'white', fontWeight: '800', fontSize: 15 },
  tgBtnPersonal:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0088cc', borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8 },
  tgBtnPersonalText: { color: 'white', fontSize: 15, flex: 1 },
  tgAvatar:          { width: 36, height: 36 },
  tgAvatarImg:       { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  tgAvatarFallback:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  tgAvatarText:      { fontSize: 13, fontWeight: '800', color: 'white' },
  tgOtherBtn:        { alignItems: 'center', paddingVertical: 6, marginBottom: 4 },
  tgOtherText:       { fontSize: 12, color: '#0088cc', fontWeight: '600' },
  googleBtn:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.white, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8, borderWidth: 1.5, borderColor: Colors.border },
  googleIcon:        { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  googleIconText:    { fontSize: 16, fontWeight: '900', color: '#4285F4' },
  googleBtnText:     { fontSize: 15, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  divider:           { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
  dividerLine:       { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:       { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  label:             { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  input:             { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  btn:               { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:           { color: 'white', fontWeight: '800', fontSize: 16 },
  link:              { marginTop: 16, alignItems: 'center' },
  linkText:          { fontSize: 14, color: Colors.textSub },
  waitBox:           { alignItems: 'center', paddingVertical: 24 },
  waitTitle:         { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  waitDesc:          { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  cancelBtn:         { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  cancelText:        { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
});
