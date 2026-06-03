import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert, Linking, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useApolloClient } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { LOGIN, CREATE_TELEGRAM_AUTH_TOKEN } from '../../apollo/mutations';
import { CHECK_TELEGRAM_AUTH_TOKEN } from '../../apollo/queries';

const POLL_INTERVAL_MS = 2000;  // har 2 soniyada so'raydi
const POLL_TIMEOUT_MS  = 120000; // 2 daqiqa timeout

export default function LoginScreen() {
  const { login }  = useAuth();
  const client     = useApolloClient();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tgLoading, setTgLoading]   = useState(false);
  const [tgStep, setTgStep]         = useState<'idle' | 'waiting'>('idle');
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [loginMutation, { loading }]          = useMutation(LOGIN);
  const [createToken]                          = useMutation(CREATE_TELEGRAM_AUTH_TOKEN);

  // Polling ni to'xtatish
  const stopPolling = () => {
    if (pollRef.current)    clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    pollRef.current    = null;
    timeoutRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  // ─── Telegram tugmasi bosilganda ──────────────────────────────────────────
  const handleTelegramAuth = async () => {
    setTgLoading(true);
    try {
      // 1. Backenddan token olamiz
      const { data } = await createToken();
      const token: string = data.createTelegramAuthToken;

      // 2. Botni ochamiz — token start parametri sifatida ketadi
      await Linking.openURL(`https://t.me/buildfuture_bot?start=tgauth_${token}`);

      // 3. Polling boshlaymiz
      setTgStep('waiting');
      setTgLoading(false);
      startPolling(token);

    } catch (e: any) {
      setTgLoading(false);
      Alert.alert('Xato', e?.message ?? 'Token yaratishda xato');
    }
  };

  // ─── Polling — bot tasdiqlashini kutamiz ──────────────────────────────────
  const startPolling = (token: string) => {
    stopPolling();

    pollRef.current = setInterval(async () => {
      try {
        const { data } = await client.query({
          query: CHECK_TELEGRAM_AUTH_TOKEN,
          variables: { token },
          fetchPolicy: 'network-only',
        });

        const user = data?.checkTelegramAuthToken;
        if (user?.accessToken) {
          stopPolling();
          setTgStep('idle');
          await login(user);
          router.replace('/(tabs)');
        }
      } catch {
        // Hali tayyor emas — davom etamiz
      }
    }, POLL_INTERVAL_MS);

    // 2 daqiqadan keyin timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setTgStep('idle');
      Alert.alert(
        'Vaqt tugadi',
        'Telegram orqali kirish 2 daqiqada amalga oshmadi. Qayta urinib ko\'ring.',
      );
    }, POLL_TIMEOUT_MS);
  };

  const cancelTelegram = () => {
    stopPolling();
    setTgStep('idle');
  };

  // ─── Login ────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Xato', 'Username va parolni kiriting');
      return;
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

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBox}>
          <Image source={require('../../assets/bufu-logo.png')} style={styles.logoCircle} resizeMode="cover" />
          <Text style={styles.appName}>BuFu</Text>
          <Text style={styles.tagline}>Frilanserlar platformasi</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Kirish</Text>

          {/* ── Telegram kutish holati ── */}
          {tgStep === 'waiting' ? (
            <View style={styles.waitBox}>
              <ActivityIndicator color="#0088cc" size="large" style={{ marginBottom: 16 }} />
              <Text style={styles.waitTitle}>Telegramni kutmoqda...</Text>
              <Text style={styles.waitDesc}>
                @buildfuture_bot botida "📱 BuFu ga kirish" tugmasini bosing
              </Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelTelegram}>
                <Text style={styles.cancelText}>Bekor qilish</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* ── Telegram tugmasi ── */}
              <TouchableOpacity
                style={[styles.telegramBtn, tgLoading && { opacity: 0.75 }]}
                onPress={handleTelegramAuth}
                disabled={tgLoading || loading}
              >
                {tgLoading
                  ? <ActivityIndicator color="white" size="small" />
                  : <Ionicons name="paper-plane" size={20} color="white" />
                }
                <Text style={styles.telegramBtnText}>
                  {tgLoading ? 'Yuklanmoqda...' : 'Telegram orqali kirish'}
                </Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>yoki</Text>
                <View style={styles.dividerLine} />
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                placeholder="username"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={styles.label}>Parol</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.btnText}>Kirish</Text>
                }
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
  container:       { flexGrow: 1, backgroundColor: Colors.bg, padding: 20, justifyContent: 'center' },
  logoBox:         { alignItems: 'center', marginBottom: 32 },
  logoCircle:      { width: 80, height: 80, borderRadius: 22, marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  appName:         { fontSize: 26, fontWeight: '900', color: Colors.text },
  tagline:         { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  card:            { backgroundColor: Colors.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  title:           { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 16 },
  telegramBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#0088cc', borderRadius: 12, paddingVertical: 14, marginBottom: 16 },
  telegramBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText:     { fontSize: 12, color: Colors.textMuted, fontWeight: '600' },
  label:           { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  input:           { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  btn:             { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:         { color: 'white', fontWeight: '800', fontSize: 16 },
  link:            { marginTop: 16, alignItems: 'center' },
  linkText:        { fontSize: 14, color: Colors.textSub },
  // Waiting state
  waitBox:         { alignItems: 'center', paddingVertical: 24 },
  waitTitle:       { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  waitDesc:        { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  cancelBtn:       { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  cancelText:      { fontSize: 14, color: Colors.textSub, fontWeight: '600' },
});
