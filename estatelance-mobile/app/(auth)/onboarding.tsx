import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { UPDATE_PROFILE } from '../../apollo/mutations';

const ROLES = [
  {
    type:  'AGENT',
    icon:  'business-outline' as const,
    emoji: '🏢',
    title: 'Ish beruvchi',
    desc:  'Frilanserlarni topib, loyihalarim uchun mutaxassislar yollayman',
    color: '#0891b2',
    bg:    '#e0f2fe',
    border:'#7dd3fc',
  },
  {
    type:  'FREELANCER',
    icon:  'briefcase-outline' as const,
    emoji: '💼',
    title: 'Frilanser',
    desc:  'Ko\'nikmalarimni taklif qilib, turli loyihalarda ishlayman',
    color: '#7c3aed',
    bg:    '#f5f3ff',
    border:'#c4b5fd',
  },
];

export default function OnboardingScreen() {
  const { user, login } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE);

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('', 'Iltimos, rolingizni tanlang');
      return;
    }
    try {
      const { data } = await updateProfile({
        variables: {
          input: { userType: selected },
        },
      });
      // User ob'ektini yangilaymiz
      await login({ ...user!, ...data.updateProfile, needsOnboarding: false });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Image source={require('../../assets/bufu-logo.png')} style={styles.logo} resizeMode="cover" />
          <Text style={styles.title}>Xush kelibsiz! 👋</Text>
          <Text style={styles.subtitle}>
            Siz kimlikda foydalanmoqchisiz?
          </Text>
        </View>

        {/* Role cards */}
        <View style={styles.cards}>
          {ROLES.map(role => {
            const isSelected = selected === role.type;
            return (
              <TouchableOpacity
                key={role.type}
                style={[
                  styles.card,
                  { borderColor: isSelected ? role.color : Colors.border },
                  isSelected && { backgroundColor: role.bg },
                ]}
                onPress={() => setSelected(role.type)}
                activeOpacity={0.8}
              >
                {/* Check badge */}
                {isSelected && (
                  <View style={[styles.checkBadge, { backgroundColor: role.color }]}>
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: isSelected ? role.color : Colors.bg, borderColor: isSelected ? role.color : Colors.border }]}>
                  <Text style={styles.emoji}>{role.emoji}</Text>
                </View>

                <Text style={[styles.roleTitle, isSelected && { color: role.color }]}>
                  {role.title}
                </Text>
                <Text style={styles.roleDesc}>{role.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue button */}
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled, loading && { opacity: 0.7 }]}
          onPress={handleContinue}
          disabled={!selected || loading}
        >
          {loading
            ? <ActivityIndicator color="white" />
            : (
              <>
                <Text style={styles.btnText}>Davom etish</Text>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </>
            )
          }
        </TouchableOpacity>

        <Text style={styles.hint}>
          Keyinchalik profilingizdagi sozlamalardan o'zgartirish mumkin
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  container:   { flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  header:      { alignItems: 'center', marginBottom: 32 },
  logo:        { width: 64, height: 64, borderRadius: 16, marginBottom: 16 },
  title:       { fontSize: 26, fontWeight: '900', color: Colors.text, marginBottom: 8 },
  subtitle:    { fontSize: 15, color: Colors.textSub, textAlign: 'center' },
  cards:       { gap: 14, marginBottom: 32 },
  card:        {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: Colors.border,
    padding: 20,
    position: 'relative',
  },
  checkBadge:  {
    position: 'absolute', top: 14, right: 14,
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  iconWrap:    {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, marginBottom: 14,
  },
  emoji:       { fontSize: 26 },
  roleTitle:   { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  roleDesc:    { fontSize: 13, color: Colors.textSub, lineHeight: 19 },
  btn:         {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, marginBottom: 16,
  },
  btnDisabled: { backgroundColor: '#a5b4fc' },
  btnText:     { color: 'white', fontWeight: '800', fontSize: 16 },
  hint:        { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
});
