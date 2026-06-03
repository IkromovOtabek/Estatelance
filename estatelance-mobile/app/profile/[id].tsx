import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Image, ActivityIndicator,
  TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_USER_BY_ID, CHECK_IS_FOLLOWING } from '../../apollo/queries';
import { TOGGLE_FOLLOW } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { User } from '../../types';

const AVAIL_OPTS: Record<string, { label: string; icon: string; color: string }> = {
  AVAILABLE:    { label: 'Band emas',      icon: 'checkmark-circle-outline', color: '#16a34a' },
  BUSY:         { label: 'Band',           icon: 'close-circle-outline',     color: '#dc2626' },
  OPEN_TO_WORK: { label: 'Ish izlayapman', icon: 'eye-outline',              color: '#0891b2' },
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();

  const { data, loading, refetch } = useQuery(GET_USER_BY_ID, {
    variables: { userId: id },
    skip: !id,
  });

  const { data: followData, refetch: refetchFollow } = useQuery(CHECK_IS_FOLLOWING, {
    variables: { targetUserId: id },
    skip: !id || !me || me._id === id,
    fetchPolicy: 'network-only',
  });

  const [toggleFollow, { loading: followLoading }] = useMutation(TOGGLE_FOLLOW);
  const [localFollowing, setLocalFollowing] = useState<boolean | null>(null);

  const user: User | null = data?.getUserById ?? null;
  const isOwnProfile = me?._id === id;
  const isFollowing = localFollowing !== null ? localFollowing : (followData?.checkIsFollowing ?? false);

  const handleFollow = async () => {
    if (!me) {
      Alert.alert('Kirish kerak', 'Kuzatish uchun tizimga kiring');
      return;
    }
    setLocalFollowing(!isFollowing);
    try {
      await toggleFollow({ variables: { targetUserId: id } });
      refetch();
      refetchFollow();
    } catch {
      setLocalFollowing(isFollowing);
    }
  };

  const handleMessage = () => {
    if (!me) {
      Alert.alert('Kirish kerak', 'Xabar yuborish uchun tizimga kiring');
      return;
    }
    if (!user) return;
    const name = encodeURIComponent(user.fullName ?? user.username);
    const avatar = encodeURIComponent(user.profileImage ?? '');
    router.push(`/messages/${id}?name=${name}&avatar=${avatar}` as any);
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.center}>
          <Ionicons name="person-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.notFoundText}>Foydalanuvchi topilmadi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user.fullName ?? user.username ?? '?')[0].toUpperCase();
  const isAvailable = user.availability === 'AVAILABLE';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {user.fullName ?? user.username}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View style={styles.profileTop}>
          {user.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}

          {/* Availability dot */}
          <View style={[styles.availDot, { backgroundColor: isAvailable ? '#22c55e' : '#f59e0b' }]} />

          <Text style={styles.name}>{user.fullName ?? user.username}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          {user.freelancerCategory && <Text style={styles.userTitle}>{user.freelancerCategory}</Text>}

          <View style={[styles.typeBadge, user.userType === 'AGENT' ? styles.agentBadge : styles.freelancerBadge]}>
            <Ionicons
              name={user.userType === 'AGENT' ? 'business-outline' : 'briefcase-outline'}
              size={13}
              color={user.userType === 'AGENT' ? '#0891b2' : '#7c3aed'}
            />
            <Text style={[styles.typeText, { color: user.userType === 'AGENT' ? '#0891b2' : '#7c3aed' }]}>
              {user.userType === 'AGENT' ? 'Mijoz' : 'Frilanser'}
            </Text>
          </View>

          {/* Action buttons — only if not own profile */}
          {!isOwnProfile && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? Colors.primary : 'white'} />
                ) : (
                  <>
                    <Ionicons
                      name={isFollowing ? 'person-remove-outline' : 'person-add-outline'}
                      size={16}
                      color={isFollowing ? Colors.primary : 'white'}
                    />
                    <Text style={[styles.followBtnText, isFollowing && { color: Colors.primary }]}>
                      {isFollowing ? 'Kuzatilmoqda' : 'Kuzatish'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.msgBtn} onPress={handleMessage}>
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="white" />
                <Text style={styles.msgBtnText}>Xabar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Kuzatuvchilar', value: user.followerCount ?? 0 },
            { label: 'Kuzatmoqda',   value: user.followingCount ?? 0 },
            { label: 'Bajarilgan',   value: user.completedJobCount ?? 0 },
            { label: 'Soatlik',      value: user.hourlyRate ? `$${user.hourlyRate}` : '—' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bio */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Skills */}
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

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Band holati</Text>
          <View style={styles.availChip}>
            {(() => {
              const opt = AVAIL_OPTS[user.availability ?? ''];
              return opt ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={opt.icon as any} size={14} color={opt.color} />
                  <Text style={[styles.availText, { color: opt.color }]}>{opt.label}</Text>
                </View>
              ) : <Text style={styles.availText}>—</Text>;
            })()}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: Colors.bg },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText:     { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
  topBar:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:          { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  topTitle:         { fontSize: 16, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  profileTop:       { alignItems: 'center', paddingTop: 28, paddingBottom: 20, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  avatar:           { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
  avatarFallback:   { width: 88, height: 88, borderRadius: 44, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText:       { fontSize: 32, fontWeight: '900', color: Colors.primary },
  availDot:         { position: 'absolute', top: 88, left: '50%', width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: Colors.white, marginLeft: 22 },
  name:             { fontSize: 21, fontWeight: '900', color: Colors.text },
  username:         { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  userTitle:        { fontSize: 13, color: Colors.textSub, marginTop: 4 },
  typeBadge:        { marginTop: 10, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 },
  agentBadge:       { backgroundColor: '#e0f2fe' },
  freelancerBadge:  { backgroundColor: '#f5f3ff' },
  typeText:         { fontSize: 13, fontWeight: '700' },
  actionRow:        { flexDirection: 'row', gap: 10, marginTop: 16, paddingHorizontal: 20 },
  followBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: Colors.primary },
  followBtnActive:  { backgroundColor: Colors.white, borderColor: Colors.primary },
  followBtnText:    { color: 'white', fontWeight: '700', fontSize: 14 },
  msgBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0891b2', borderRadius: 12, paddingVertical: 11 },
  msgBtnText:       { color: 'white', fontWeight: '700', fontSize: 14 },
  statsRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard:         { flex: 1, minWidth: '44%', backgroundColor: Colors.white, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statValue:        { fontSize: 20, fontWeight: '900', color: Colors.primary },
  statLabel:        { fontSize: 11, color: Colors.textSub, marginTop: 3, textAlign: 'center' },
  section:          { backgroundColor: Colors.white, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border },
  sectionTitle:     { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  bioText:          { fontSize: 14, color: Colors.textSub, lineHeight: 20 },
  skillsWrap:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip:        { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  skillText:        { fontSize: 13, color: Colors.textSub },
  availChip:        { backgroundColor: Colors.bg, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  availText:        { fontSize: 14, fontWeight: '600', color: Colors.text },
});
