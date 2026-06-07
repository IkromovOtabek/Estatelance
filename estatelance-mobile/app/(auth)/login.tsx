import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useApolloClient } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
// expo-web-browser Expo Go'da bo'lmasligi mumkin — xavfsiz yuklash
let WebBrowser: any = null;
try { WebBrowser = require('expo-web-browser'); } catch { /* Expo Go */ }
import { Colors } from '../../constants/colors';
import { safeImageUri } from '../../libs/safeImage';
import { useAuth } from '../../hooks/useAuth';
import { LOGIN, CREATE_TELEGRAM_AUTH_TOKEN, CREATE_GOOGLE_AUTH_TOKEN } from '../../apollo/mutations';
import { CHECK_TELEGRAM_AUTH_TOKEN, CHECK_GOOGLE_AUTH_TOKEN, GET_ME } from '../../apollo/queries';

const POLL_MS    = 2000;
const TIMEOUT_MS = 120000;
const TG_KEY     = 'lastTgUser';
const G_KEY      = 'lastGoogleUser';
const REM_KEY    = 'rememberedToken';

interface SavedUser { name: string; photo?: string; provider: 'telegram' | 'google'; }

export default function LoginScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => createStyles(), [themeKey]);
  const { login } = useAuth();
  const client    = useApolloClient();

  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [tgLoading, setTgLoading]     = useState(false);
  const [gLoading, setGLoading]       = useState(false);
  const [waitFor, setWaitFor]         = useState<'idle'|'telegram'|'google'>('idle');
  const [savedTg, setSavedTg]         = useState<SavedUser | null>(null);
  const [savedG, setSavedG]           = useState<SavedUser | null>(null);

  const pollRef  = useRef<ReturnType<typeof setInterval>|null>(null);
  const toutRef  = useRef<ReturnType<typeof setTimeout>|null>(null);

  const [loginMut, { loading }]  = useMutation(LOGIN);
  const [createTgToken]          = useMutation(CREATE_TELEGRAM_AUTH_TOKEN);
  const [createGToken]           = useMutation(CREATE_GOOGLE_AUTH_TOKEN);

  useEffect(() => {
    AsyncStorage.getItem(TG_KEY).then(v => { if (v) setSavedTg(JSON.parse(v)); });
    AsyncStorage.getItem(G_KEY).then(v  => { if (v) setSavedG(JSON.parse(v));  });
    return stopPoll;
  }, []);

  const stopPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (toutRef.current) clearTimeout(toutRef.current);
    pollRef.current = null; toutRef.current = null;
  };

  const finishLogin = async (user: any) => {
    stopPoll();
    setWaitFor('idle');
    setTgLoading(false);
    setGLoading(false);
    await login(user);
    if (user.needsOnboarding) router.replace('/(auth)/onboarding');
    else router.replace('/(tabs)');
  };

  // ─── Tez kirish (saqlangan token) ─────────────────────────────────────────
  const quickLogin = async (provider: 'telegram'|'google') => {
    provider === 'telegram' ? setTgLoading(true) : setGLoading(true);
    try {
      const token = await AsyncStorage.getItem(REM_KEY);
      if (!token) {
        provider === 'telegram' ? setTgLoading(false) : setGLoading(false);
        provider === 'telegram' ? handleTg() : handleGoogle();
        return;
      }
      const { data } = await client.query({
        query: GET_ME, fetchPolicy: 'network-only',
        context: { headers: { authorization: `Bearer ${token}` } },
      });
      if (data?.getMyProfile) {
        await AsyncStorage.setItem('accessToken', token);
        await finishLogin({ ...data.getMyProfile, accessToken: token });
      } else {
        provider === 'telegram' ? setTgLoading(false) : setGLoading(false);
        provider === 'telegram' ? handleTg() : handleGoogle();
      }
    } catch {
      provider === 'telegram' ? setTgLoading(false) : setGLoading(false);
      provider === 'telegram' ? handleTg() : handleGoogle();
    }
  };

  // ─── Telegram ─────────────────────────────────────────────────────────────
  const handleTg = async () => {
    setTgLoading(true);
    try {
      const { data } = await createTgToken();
      const token: string = data.createTelegramAuthToken;
      await Linking.openURL(`https://t.me/buildfuture_bot?start=tgauth_${token}`);
      setTgLoading(false);
      setWaitFor('telegram');
      poll(token, 'telegram');
    } catch (e: any) {
      setTgLoading(false);
      Alert.alert('Xato', e?.message ?? 'Telegram xato');
    }
  };

  // ─── Google ───────────────────────────────────────────────────────────────
  const handleGoogle = async () => {
    setGLoading(true);
    try {
      const { data } = await createGToken();
      const token: string = data.createGoogleAuthToken;
      const res  = await fetch(`https://api.bufu.uz/auth/google/mobile-url?mob=${token}`);
      const json = await res.json();
      setGLoading(false);
      setWaitFor('google');
      poll(token, 'google');
      if (WebBrowser?.openAuthSessionAsync) {
        await WebBrowser.openAuthSessionAsync(json.url, 'bufu://');
      } else {
        // Expo Go: native brauzer yo'q — tashqi brauzerda ochamiz
        await Linking.openURL(json.url);
      }
    } catch (e: any) {
      setGLoading(false);
      setWaitFor('idle');
      stopPoll();
      Alert.alert('Xato', e?.message ?? 'Google xato');
    }
  };

  // ─── Polling ──────────────────────────────────────────────────────────────
  const poll = (token: string, type: 'telegram'|'google') => {
    stopPoll();
    const query   = type === 'google' ? CHECK_GOOGLE_AUTH_TOKEN : CHECK_TELEGRAM_AUTH_TOKEN;
    const dataKey = type === 'google' ? 'checkGoogleAuthToken'  : 'checkTelegramAuthToken';

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.query({ query, variables: { token }, fetchPolicy: 'network-only' });
        const user = data?.[dataKey];
        if (user?.accessToken) {
          // Keyingi tez kirish uchun saqlash
          const saved: SavedUser = {
            name:     user.fullName ?? user.username,
            photo:    user.profileImage ?? null,
            provider: type,
          };
          if (type === 'telegram') {
            await AsyncStorage.setItem(TG_KEY, JSON.stringify(saved));
            setSavedTg(saved);
          } else {
            await AsyncStorage.setItem(G_KEY, JSON.stringify(saved));
            setSavedG(saved);
          }
          await finishLogin(user);
        }
      } catch {}
    }, POLL_MS);

    toutRef.current = setTimeout(() => {
      stopPoll(); setWaitFor('idle');
      Alert.alert('Vaqt tugadi', `${type === 'google' ? 'Google' : 'Telegram'} orqali kirish amalga oshmadi.`);
    }, TIMEOUT_MS);
  };

  // ─── Username/password ────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Xato', 'Username va parolni kiriting'); return;
    }
    try {
      const { data } = await loginMut({ variables: { input: { username: username.trim(), password } } });
      await login(data.login);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  // ─── UI ───────────────────────────────────────────────────────────────────
  const isAnyLoading = tgLoading || gLoading || loading;

  if (waitFor !== 'idle') {
    return (
      <View style={styles.waitScreen}>
        <ActivityIndicator color={waitFor === 'google' ? '#4285F4' : '#0088cc'} size="large" />
        <View style={styles.waitIconRow}>
          {waitFor === 'google'
            ? <AntDesign name="google" size={36} color="#4285F4" />
            : <Ionicons name="paper-plane" size={28} color="#0088cc" />
          }
        </View>
        <Text style={styles.waitTitle}>
          {waitFor === 'google' ? 'Google kutilmoqda...' : 'Telegram kutilmoqda...'}
        </Text>
        <Text style={styles.waitDesc}>
          {waitFor === 'google'
            ? 'Google hisobingizga kirish yakunlangach ilova avtomatik davom etadi'
            : '@buildfuture_bot da "BuFu ga kirish" tugmasini bosing'}
        </Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => { stopPoll(); setWaitFor('idle'); }}>
          <Text style={styles.cancelText}>Bekor qilish</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Home tugmasi */}
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoBox}>
          <Image source={require('../../assets/bufu-logo.png')} style={styles.logo} resizeMode="cover" />
          <Text style={styles.appName}>BuFu</Text>
          <Text style={styles.tagline}>Frilanserlar platformasi</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Kirish</Text>

          {/* ── Username / Parol ── */}
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input} placeholder="username"
            placeholderTextColor={Colors.textMuted}
            value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false}
          />
          <Text style={styles.label}>Parol</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={styles.passInput} placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(v => !v)}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin} disabled={loading}
          >
            {loading ? <ActivityIndicator color="white" /> : <Text style={styles.loginBtnText}>Kirish</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.regLink} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.regLinkText}>
              Akkount yo'qmi? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Ro'yxatdan o'tish</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>yoki</Text>
            <View style={styles.divLine} />
          </View>

          {/* ── Saqlangan akkauntlar ── */}
          {savedTg && (
            <SavedAccountBtn
              user={savedTg} loading={tgLoading}
              onPress={() => quickLogin('telegram')}
              onRemove={() => { setSavedTg(null); AsyncStorage.removeItem(TG_KEY); }}
            />
          )}
          {savedG && (
            <SavedAccountBtn
              user={savedG} loading={gLoading}
              onPress={() => quickLogin('google')}
              onRemove={() => { setSavedG(null); AsyncStorage.removeItem(G_KEY); }}
            />
          )}

          {/* ── Telegram + Google tugmalari ── */}
          <View style={styles.socialRow}>
            {!savedTg && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.tgSocialBtn, isAnyLoading && { opacity: 0.6 }]}
                onPress={handleTg} disabled={isAnyLoading} activeOpacity={0.8}
              >
                {tgLoading
                  ? <ActivityIndicator color="white" size="small" />
                  : <Ionicons name="paper-plane" size={17} color="white" />
                }
                <Text style={styles.tgSocialText}>Telegram</Text>
              </TouchableOpacity>
            )}
            {!savedG && (
              <TouchableOpacity
                style={[styles.socialBtn, styles.gSocialBtn, isAnyLoading && { opacity: 0.6 }]}
                onPress={handleGoogle} disabled={isAnyLoading} activeOpacity={0.8}
              >
                {gLoading
                  ? <ActivityIndicator color="#4285F4" size="small" />
                  : <AntDesign name="google" size={17} color="#4285F4" />
                }
                <Text style={styles.gSocialText}>Google</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Saqlangan akkaunt tugmasi ─────────────────────────────────────────────
function SavedAccountBtn({ user, loading, onPress, onRemove }: {
  user: SavedUser; loading: boolean;
  onPress: () => void; onRemove: () => void;
}) {
  const styles = useMemo(() => createStyles(), []);
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const isTg  = user.provider === 'telegram';
  const color = isTg ? '#0088cc' : '#4285F4';

  return (
    <TouchableOpacity style={[styles.savedBtn, { borderColor: color + '33' }]} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar */}
      <View style={styles.savedAvatar}>
        {safeImageUri(user.photo)
          ? <Image source={{ uri: safeImageUri(user.photo) }} style={styles.savedAvatarImg} />
          : <View style={[styles.savedAvatarFallback, { backgroundColor: color + '22' }]}>
              <Text style={[styles.savedAvatarText, { color }]}>{initials}</Text>
            </View>
        }
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.savedName} numberOfLines={1}>{user.name}</Text>
        <View style={styles.savedProviderRow}>
          {isTg
            ? <Ionicons name="paper-plane" size={12} color={color} />
            : <AntDesign name="google" size={12} color={color} />
          }
          <Text style={[styles.savedProvider, { color }]}>
            {isTg ? 'Telegram' : 'Google'} orqali kirish
          </Text>
        </View>
      </View>

      {/* Loading / Arrow */}
      {loading
        ? <ActivityIndicator size="small" color={color} />
        : <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      }

      {/* Remove */}
      <TouchableOpacity
        style={styles.savedRemove}
        onPress={(e) => { e.stopPropagation?.(); onRemove(); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="close" size={14} color={Colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const createStyles = () => StyleSheet.create({
  container:          { flexGrow: 1, backgroundColor: Colors.bg, padding: 20, justifyContent: 'center' },
  homeBtn:            { position: 'absolute', top: 87, left: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  logoBox:            { alignItems: 'center', marginBottom: 28 },
  logo:               { width: 72, height: 72, borderRadius: 20, marginBottom: 10 },
  appName:            { fontSize: 24, fontWeight: '900', color: Colors.text },
  tagline:            { fontSize: 12, color: Colors.textSub, marginTop: 3 },
  card:               { backgroundColor: Colors.white, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: Colors.border },
  cardTitle:          { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 16 },

  // Saqlangan akkaunt
  savedBtn:           { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 10, backgroundColor: Colors.bg, position: 'relative' },
  savedAvatar:        { width: 44, height: 44 },
  savedAvatarImg:     { width: 44, height: 44, borderRadius: 22 },
  savedAvatarFallback:{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  savedAvatarText:    { fontSize: 16, fontWeight: '900' },
  savedName:          { fontSize: 15, fontWeight: '700', color: Colors.text },
  savedProviderRow:   { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  savedProvider:      { fontSize: 12, fontWeight: '600' },
  gIconXs:            { fontSize: 12, fontWeight: '900' },
  savedRemove:        { padding: 4, marginLeft: 4 },

  // Yangi akkaunt tugmalari
  socialRow:          { flexDirection: 'row', gap: 10, marginBottom: 4 },
  socialBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  tgSocialBtn:        { backgroundColor: '#0088cc' },
  tgSocialText:       { color: 'white', fontWeight: '700', fontSize: 14 },
  gSocialBtn:         { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  gSocialText:        { color: Colors.text, fontWeight: '700', fontSize: 14 },
  gIcon:              { fontSize: 16, fontWeight: '900', color: '#4285F4' },

  // Boshqa provider
  otherRow:           { marginTop: 4, marginBottom: 4 },
  otherBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  gIconSm:            { fontSize: 14, fontWeight: '900', color: '#4285F4' },
  otherText:          { fontSize: 13, color: Colors.textSub, fontWeight: '600' },

  divider:            { flexDirection: 'row', alignItems: 'center', marginVertical: 14, gap: 10 },
  divLine:            { flex: 1, height: 1, backgroundColor: Colors.border },
  divText:            { fontSize: 12, color: Colors.textMuted },
  label:              { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  input:              { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  passWrap:           { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 10, backgroundColor: Colors.white, marginBottom: 14, height: 48 },
  passInput:          { flex: 1, paddingHorizontal: 14, fontSize: 15, color: Colors.text, height: 48 },
  eyeBtn:             { paddingHorizontal: 12, height: 48, alignItems: 'center', justifyContent: 'center' },
  loginBtn:           { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  loginBtnText:       { color: 'white', fontWeight: '800', fontSize: 16 },
  regLink:            { marginTop: 16, alignItems: 'center' },
  regLinkText:        { fontSize: 14, color: Colors.textSub },

  // Waiting ekrani
  waitScreen:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, padding: 40 },
  waitIconRow:        { marginBottom: 16 },
  waitGIcon:          { fontSize: 40, fontWeight: '900' },
  waitTitle:          { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  waitDesc:           { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  cancelBtn:          { paddingHorizontal: 28, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  cancelText:         { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
});
