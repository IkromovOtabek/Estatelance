import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { THEMES, ThemeKey } from '../constants/themes';
import { useTheme } from '../hooks/useThemeContext';
import { useToast } from '../components/Toast';

function ThemePreview({ preview }: { preview: { bg: string; card: string; accent: string; text: string; bar: string } }) {
  return (
    <View style={[s.preview, { backgroundColor: preview.bg }]}>
      {/* Fake header */}
      <View style={[s.pHeader, { backgroundColor: preview.card, borderBottomColor: preview.text + '15' }]}>
        <View style={[s.pDot, { backgroundColor: preview.text + '50' }]} />
        <View style={[s.pLine, { backgroundColor: preview.text + '40', width: 60 }]} />
        <View style={{ flex: 1 }} />
        <View style={[s.pDot, { backgroundColor: preview.accent + '80', width: 18, height: 18, borderRadius: 9 }]} />
      </View>
      {/* Fake card */}
      <View style={{ padding: 8 }}>
        <View style={[s.pCard, { backgroundColor: preview.card }]}>
          <View style={[s.pLine, { backgroundColor: preview.text + '70', width: '65%', height: 7, marginBottom: 6 }]} />
          <View style={[s.pLine, { backgroundColor: preview.text + '30', width: '90%' }]} />
          <View style={[s.pLine, { backgroundColor: preview.text + '20', width: '75%', marginTop: 3 }]} />
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
            <View style={[s.pBtn, { backgroundColor: preview.accent, flex: 2 }]} />
            <View style={[s.pBtn, { backgroundColor: preview.text + '12', flex: 1, borderWidth: 1, borderColor: preview.text + '20' }]} />
          </View>
        </View>
      </View>
      {/* Fake navbar */}
      <View style={[s.pBar, { backgroundColor: preview.bar, borderTopColor: preview.text + '15' }]}>
        {[preview.accent, preview.text + '35', preview.text + '35', preview.text + '35'].map((c, i) => (
          <View key={i} style={s.pBarItem}>
            <View style={[s.pBarIcon, { backgroundColor: c }]} />
            <View style={[s.pLine, { backgroundColor: c, width: 18, height: 3, marginTop: 3 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ThemeSelectScreen() {
  const { themeKey, setTheme, theme: currentTheme } = useTheme();
  const { show: showToast } = useToast();
  const [autoTheme, setAutoTheme] = useState(false);

  const C = currentTheme.colors;

  const handleSelect = (key: ThemeKey) => {
    setTheme(key);
    const name = THEMES.find(t => t.key === key)?.name ?? '';
    showToast({ message: `Tema: ${name}`, type: 'success' });
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: C.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: C.white, borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: C.bg }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: C.text }]}>Interfeys temasi</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={[s.desc, { color: C.textSub }]}>
        Platforma ko'rinishini o'zingizga moslashtiring.{'\n'}Har bir mavzu professional ish muhiti uchun optimallashtirilgan.
      </Text>

      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        {THEMES.map(theme => {
          const active = themeKey === theme.key;
          return (
            <TouchableOpacity
              key={theme.key}
              style={[
                s.card,
                { backgroundColor: C.white, borderColor: active ? C.primary : C.border },
                active && { borderWidth: 2 },
              ]}
              onPress={() => handleSelect(theme.key)}
              activeOpacity={0.85}
            >
              {active && (
                <View style={[s.badge, { backgroundColor: C.primary }]}>
                  <Text style={s.badgeText}>ACTIVE</Text>
                </View>
              )}

              <ThemePreview preview={theme.preview} />

              <View style={s.info}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: C.text }]}>{theme.name}</Text>
                  <Text style={[s.themDesc, { color: C.textSub }]}>{theme.desc}</Text>
                </View>
                <View style={[s.radio, { borderColor: active ? C.primary : C.border }]}>
                  {active && <View style={[s.radioDot, { backgroundColor: C.primary }]} />}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Avtomatik rejim */}
        <View style={[s.card, s.autoCard, { backgroundColor: C.white, borderColor: C.border }]}>
          <View style={s.info}>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, { color: C.text }]}>Avtomatik rejim</Text>
              <Text style={[s.themDesc, { color: C.textSub }]}>
                Tizim sozlamalariga qarab mavzuni avtomatik o'zgartirish.
              </Text>
            </View>
            <Switch
              value={autoTheme}
              onValueChange={v => {
                setAutoTheme(v);
                showToast({ message: v ? 'Avtomatik rejim yoqildi' : "O'chirildi", type: 'info' });
              }}
              trackColor={{ false: C.border, true: C.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:     { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:    { fontSize: 17, fontWeight: '800' },
  desc:     { fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  body:     { padding: 16, gap: 12, paddingBottom: 40 },

  card:     { borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  autoCard: { paddingVertical: 4 },
  badge:    { position: 'absolute', top: 12, right: 12, zIndex: 10, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:{ color: 'white', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  info:     { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  name:     { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  themDesc: { fontSize: 12, lineHeight: 17 },
  radio:    { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  // Preview
  preview:  { height: 140, margin: 12, marginBottom: 0, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  pHeader:  { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
  pDot:     { width: 22, height: 22, borderRadius: 11 },
  pLine:    { height: 6, borderRadius: 3 },
  pCard:    { borderRadius: 8, padding: 10 },
  pBtn:     { height: 20, borderRadius: 6 },
  pBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', borderTopWidth: 1, paddingVertical: 6 },
  pBarItem: { flex: 1, alignItems: 'center', gap: 2 },
  pBarIcon: { width: 16, height: 16, borderRadius: 4 },
});
