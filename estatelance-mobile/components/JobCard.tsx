import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Job } from '../types';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  OPEN:      { label: 'Ochiq',   color: '#4f46e5', bg: '#eef2ff' },
  ACTIVE:    { label: 'Faol',    color: '#0891b2', bg: '#e0f2fe' },
  COMPLETED: { label: 'Tugagan', color: '#16a34a', bg: '#dcfce7' },
  CANCELLED: { label: 'Bekor',   color: '#dc2626', bg: '#fee2e2' },
};

const CAT_LABELS: Record<string, string> = {
  PHOTOGRAPHY: 'Foto',
  RENDERING:   '3D',
  LEGAL:       'Yuridik',
  REPAIR:      'Ta\'mirlash',
  CLEANING:    'Tozalash',
  MOVING:      'Ko\'chirish',
  DESIGN:      'Dizayn',
  VALUATION:   'Baholash',
  SECURITY:    'Xavfsizlik',
  OTHER:       'Boshqa',
};

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1)  return 'hozirgina';
  if (m < 60) return `${m}d`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s`;
  return `${Math.floor(h / 24)}k`;
}

interface Props { job: Job; onPress: () => void; }

export default function JobCard({ job, onPress }: Props) {
  const st = STATUS_MAP[job.status] ?? STATUS_MAP.OPEN;
  const isBoosted = !!job.boostExpiresAt && new Date(job.boostExpiresAt).getTime() > Date.now();

  return (
    <TouchableOpacity
      style={[styles.card, isBoosted && styles.boostedCard]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: st.bg }]}>
          <Text style={[styles.badgeText, { color: st.color }]}>{st.label}</Text>
        </View>
        {isBoosted && (
          <View style={[styles.badge, styles.boostBadge]}>
            <Text style={[styles.badgeText, { color: '#7c3aed' }]}>
              {job.boostPlan === 'VIP' ? '⭐ VIP' : job.boostPlan === 'PRO' ? '⚡ Pro' : '🔵 Top'}
            </Text>
          </View>
        )}
        {job.category && (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{CAT_LABELS[job.category] ?? job.category}</Text>
          </View>
        )}
        <Text style={styles.time}>{timeAgo(job.createdAt)}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{job.title}</Text>

      {/* Description */}
      <Text style={styles.desc} numberOfLines={2}>{job.description}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.bidsRow}>
          <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.bidsText}>{job.bidCount ?? 0} taklif</Text>
        </View>
        <Text style={styles.budget}>${job.budget}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  boostedCard: { borderColor: '#a78bfa', borderWidth: 1.5 },
  topRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 5, flexWrap: 'wrap' },
  badge:       { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  badgeText:   { fontSize: 10, fontWeight: '700' },
  boostBadge:  { backgroundColor: '#f5f3ff' },
  catBadge:    { backgroundColor: Colors.bg, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5, borderWidth: 1, borderColor: Colors.border },
  catText:     { fontSize: 10, color: Colors.textSub, fontWeight: '600' },
  time:        { fontSize: 10, color: Colors.textMuted, marginLeft: 'auto' },
  title:       { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 3 },
  desc:        { fontSize: 12, color: Colors.textSub, lineHeight: 17, marginBottom: 8 },
  footer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bidsRow:     { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bidsText:    { fontSize: 11, color: Colors.textMuted },
  budget:      { fontSize: 15, fontWeight: '900', color: Colors.green },
});
