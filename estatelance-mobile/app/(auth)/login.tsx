import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { LOGIN } from '../../apollo/mutations';

export default function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMutation, { loading }] = useMutation(LOGIN);

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

  const handleTelegramAuth = () => {
    Linking.openURL('https://t.me/buildfuture_bot?start=auth');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>BF</Text>
          </View>
          <Text style={styles.appName}>BuFu</Text>
          <Text style={styles.tagline}>Frilanserlar platformasi</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>Kirish</Text>

          {/* Telegram Auth */}
          <TouchableOpacity style={styles.telegramBtn} onPress={handleTelegramAuth}>
            <Ionicons name="paper-plane" size={20} color="white" />
            <Text style={styles.telegramBtnText}>Telegram orqali kirish</Text>
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:       { flexGrow: 1, backgroundColor: Colors.bg, padding: 20, justifyContent: 'center' },
  logoBox:         { alignItems: 'center', marginBottom: 32 },
  logoCircle:      { width: 80, height: 80, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  logoText:        { fontSize: 28, fontWeight: '900', color: 'white' },
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
});
