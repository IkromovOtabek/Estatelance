import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { SIGNUP } from '../../apollo/mutations';

const USER_TYPES = [
  { value: 'AGENT',      label: '🏠 Mijoz (ish beruvchi)' },
  { value: 'FREELANCER', label: '💼 Frilanser' },
];

export default function RegisterScreen() {
  const { login } = useAuth();
  const [username, setUsername]   = useState('');
  const [fullName, setFullName]   = useState('');
  const [password, setPassword]   = useState('');
  const [userType, setUserType]   = useState('FREELANCER');

  const [signup, { loading }] = useMutation(SIGNUP);

  const handleRegister = async () => {
    if (!username.trim() || !password.trim() || !fullName.trim()) {
      Alert.alert('Xato', 'Barcha maydonlarni to\'ldiring');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Xato', 'Parol kamida 6 ta belgidan iborat bo\'lsin');
      return;
    }
    try {
      const { data } = await signup({
        variables: { input: { username: username.trim(), fullName: fullName.trim(), password, userType } },
      });
      await login(data.signup);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>BF</Text>
          </View>
          <Text style={styles.appName}>BuFu</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Ro'yxatdan o'tish</Text>

          {/* User type selector */}
          <Text style={styles.label}>Men kim?</Text>
          <View style={styles.typeRow}>
            {USER_TYPES.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeBtn, userType === t.value && styles.typeBtnActive]}
                onPress={() => setUserType(t.value)}
              >
                <Text style={[styles.typeBtnText, userType === t.value && { color: Colors.primary }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>To'liq ism</Text>
          <TextInput
            style={styles.input} placeholder="Ism Familiya"
            placeholderTextColor={Colors.textMuted}
            value={fullName} onChangeText={setFullName}
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input} placeholder="username"
            placeholderTextColor={Colors.textMuted}
            value={username} onChangeText={setUsername}
            autoCapitalize="none" autoCorrect={false}
          />

          <Text style={styles.label}>Parol</Text>
          <TextInput
            style={styles.input} placeholder="Kamida 6 ta belgi"
            placeholderTextColor={Colors.textMuted}
            value={password} onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleRegister} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.btnText}>Ro'yxatdan o'tish</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.back()}>
            <Text style={styles.linkText}>Allaqachon akkount bor? <Text style={{ color: Colors.primary, fontWeight: '700' }}>Kirish</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, backgroundColor: Colors.bg, padding: 20, justifyContent: 'center' },
  logoBox:        { alignItems: 'center', marginBottom: 24 },
  logoCircle:     { width: 60, height: 60, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoText:       { fontSize: 22, fontWeight: '900', color: 'white' },
  appName:        { fontSize: 22, fontWeight: '900', color: Colors.text },
  card:           { backgroundColor: Colors.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.border },
  title:          { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  label:          { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  typeRow:        { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive:  { borderColor: Colors.primary, backgroundColor: '#eef2ff' },
  typeBtnText:    { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14,
  },
  btn:            { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText:        { color: 'white', fontWeight: '800', fontSize: 16 },
  link:           { marginTop: 16, alignItems: 'center' },
  linkText:       { fontSize: 14, color: Colors.textSub },
});
