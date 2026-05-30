import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_MY_NOTIFICATIONS } from '../../apollo/queries';
import { MARK_NOTIFICATIONS_READ } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { Notification } from '../../types';

const TYPE_ICONS: Record<string, { name: any; color: string }> = {
  BID_RECEIVED: { name: 'cash-outline',         color: '#4f46e5' },
  BID_ACCEPTED: { name: 'checkmark-circle',      color: '#16a34a' },
  JOB_COMPLETED:{ name: 'trophy-outline',        color: '#b45309' },
  MESSAGE:      { name: 'chatbubble-outline',    color: '#0891b2' },
  SYSTEM:       { name: 'information-circle',    color: '#64748b' },
};

function timeAgo(d?: string) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 60) return `${m} daq`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat`;
  return `${Math.floor(h / 24)} kun`;
}

export default function NotificationsScreen() {
  const { data, loading, refetch } = useQuery(GET_MY_NOTIFICATIONS);
  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ);

  useEffect(() => {
    markRead().catch(() => {});
  }, []);

  const notifications: Notification[] = data?.getMyNotifications ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bildirishnomalar</Text>
      </View>

      {loading && notifications.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.SYSTEM;
            return (
              <View style={[styles.notifCard, !item.isRead && styles.notifUnread]}>
                <View style={[styles.iconBox, { backgroundColor: icon.color + '18' }]}>
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                </View>
                {!item.isRead && <View style={styles.dot} />}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Bildirishnomalar yo'q</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  header:       { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: Colors.text },
  list:         { paddingHorizontal: 16, paddingBottom: 20 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyText:    { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
  notifCard:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: Colors.border },
  notifUnread:  { borderColor: '#c7d2fe', backgroundColor: '#fefeff' },
  iconBox:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifTitle:   { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  notifMsg:     { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
  notifTime:    { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginTop: 4, flexShrink: 0 },
});
