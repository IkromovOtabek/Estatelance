import React, { useMemo } from 'react';
import { useTheme } from '../hooks/useThemeContext';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { User } from '../types';
import { safeImageUri } from '../libs/safeImage';

interface Props {
  user: User;
  onPress: () => void;
}

export default function FreelancerCard({ user, onPress }: Props) {
  const { themeKey } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: Colors.white,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border,
      elevation: 2,
    },
    row:           { flexDirection: 'row', alignItems: 'flex-start' },
    avatar:        { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
    avatarFallback:{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    avatarText:    { fontSize: 18, fontWeight: '800', color: Colors.primary },
    info:          { flex: 1 },
    name:          { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
    title:         { fontSize: 13, color: Colors.textSub, marginBottom: 6 },
    metaRow:       { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    chip:          { backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    chipText:      { fontSize: 11, color: Colors.primary, fontWeight: '600' },
    metaItem:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
    metaText:      { fontSize: 11, color: Colors.textMuted },
    skillsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    skillChip:     { backgroundColor: Colors.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
    skillText:     { fontSize: 11, color: Colors.textSub },
    moreText:      { fontSize: 11, color: Colors.textMuted, alignSelf: 'center' },
  }), [themeKey]);
  const initials = (user.fullName ?? user.username ?? '?')[0].toUpperCase();

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.row}>
        {safeImageUri(user.profileImage) ? (
          <Image source={{ uri: safeImageUri(user.profileImage) }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{user.fullName ?? user.username}</Text>
          {user.freelancerCategory ? <Text style={styles.title} numberOfLines={1}>{user.freelancerCategory}</Text> : null}
          <View style={styles.metaRow}>
            {user.hourlyRate ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>${user.hourlyRate}/soat</Text>
              </View>
            ) : null}
            {user.availability === 'AVAILABLE' && (
              <View style={[styles.chip, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.chipText, { color: '#16a34a' }]}>Band emas</Text>
              </View>
            )}
            {(user.completedJobCount ?? 0) > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="checkmark-circle" size={12} color={Colors.green} />
                <Text style={styles.metaText}>{user.completedJobCount} ish</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      {user.skills && user.skills.length > 0 ? (
        <View style={styles.skillsRow}>
          {user.skills.slice(0, 4).map(s => (
            <View key={s} style={styles.skillChip}>
              <Text style={styles.skillText}>{s}</Text>
            </View>
          ))}
          {user.skills.length > 4 ? (
            <Text style={styles.moreText}>+{user.skills.length - 4}</Text>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

