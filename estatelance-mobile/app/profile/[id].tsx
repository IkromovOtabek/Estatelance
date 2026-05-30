import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_USER_BY_ID } from '../../apollo/queries';
import { Colors } from '../../constants/colors';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, loading } = useQuery(GET_USER_BY_ID, { variables: { userId: id } });

  const user = data?.getUserById;

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!user)   return <View style={styles.center}><Text>Foydalanuvchi topilmadi</Text></View>;

  const initials = (user.fullName ?? user.username ?? '?')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Profil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileTop}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.fullName ?? user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.title && <Text style={styles.userTitle}>{user.title}</Text>}
          <View style={[styles.typeBadge, user.userType === 'AGENT' ? styles.agentBadge : styles.freelancerBadge]}>
            <Text style={[styles.typeText, user.userType === 'AGENT' ? { color: '#0891b2' } : { color: '#7c3aed' }]}>
              {user.userType === 'AGENT' ? '🏠 Mijoz' : '💼 Frilanser'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Bajarilgan', value: user.completedJobCount ?? 0 },
            { label: 'Soatlik',    value: user.hourlyRate ? `$${user.hourlyRate}` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {user.skills && user.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ko'nikmalar</Text>
            <View style={styles.skillsWrap}>
              {user.skills.map((s: string) => (
                <View key={s} style={styles.skillChip}>
                  <Text style={styles.skillText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: Colors.bg },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:         { marginRight: 12 },
  topTitle:        { fontSize: 16, fontWeight: '700', color: Colors.text },
  profileTop:      { alignItems: 'center', paddingTop: 24, paddingBottom: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:          { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarFallback:  { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:      { fontSize: 30, fontWeight: '900', color: Colors.primary },
  name:            { fontSize: 20, fontWeight: '900', color: Colors.text },
  username:        { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  userTitle:       { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  typeBadge:       { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  agentBadge:      { backgroundColor: '#e0f2fe' },
  freelancerBadge: { backgroundColor: '#f5f3ff' },
  typeText:        { fontSize: 13, fontWeight: '700' },
  statsRow:        { flexDirection: 'row', gap: 12, padding: 16 },
  statCard:        { flex: 1, backgroundColor: Colors.white, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue:       { fontSize: 22, fontWeight: '900', color: Colors.primary },
  statLabel:       { fontSize: 12, color: Colors.textSub, marginTop: 4 },
  section:         { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle:    { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  bioText:         { fontSize: 14, color: Colors.textSub, lineHeight: 20 },
  skillsWrap:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:       { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  skillText:       { fontSize: 13, color: Colors.textSub },
});
