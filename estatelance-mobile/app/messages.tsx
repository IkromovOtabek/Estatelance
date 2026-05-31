import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../constants/colors';

const MOCK_CHATS = [
  { id: '1', name: 'Jasur Toshmatov', avatar: null, lastMsg: 'Loyiha uchun narx qancha?', time: '10:24', unread: 2, online: true },
  { id: '2', name: 'Malika Yusupova', avatar: null, lastMsg: 'Xop, holda kelishamiz 👍', time: '09:15', unread: 0, online: false },
  { id: '3', name: 'Sherzod Karimov', avatar: null, lastMsg: 'Ertaga uchrashamizmi?', time: 'Kecha', unread: 1, online: true },
  { id: '4', name: 'Dilorom Nazarova', avatar: null, lastMsg: 'Rahmat, juda yaxshi ish!', time: 'Kecha', unread: 0, online: false },
  { id: '5', name: 'Bobur Aliyev', avatar: null, lastMsg: 'Portfolio yuborishingiz mumkinmi?', time: 'Dush', unread: 0, online: false },
];

export default function MessagesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xabarlar</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="create-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Chat list */}
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const initials = item.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <TouchableOpacity style={styles.chatRow} activeOpacity={0.75}>
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                {item.online && <View style={styles.onlineDot} />}
              </View>

              {/* Info */}
              <View style={styles.chatInfo}>
                <View style={styles.chatTop}>
                  <Text style={[styles.chatName, item.unread > 0 && styles.chatNameBold]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.chatTime, item.unread > 0 && { color: Colors.primary }]}>
                    {item.time}
                  </Text>
                </View>
                <View style={styles.chatBottom}>
                  <Text
                    style={[styles.chatMsg, item.unread > 0 && styles.chatMsgBold]}
                    numberOfLines={1}
                  >
                    {item.lastMsg}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Xabarlar yo'q</Text>
            <Text style={styles.emptyText}>Frilanser yoki mijoz bilan muloqot boshlang</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, fontSize: 18, fontWeight: '800', color: Colors.text, marginLeft: 4 },
  iconBtn:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  list:           { paddingVertical: 8 },
  separator:      { height: 1, backgroundColor: Colors.border, marginLeft: 80 },
  chatRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white },
  avatarWrap:     { position: 'relative', marginRight: 12 },
  avatar:         { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  avatarText:     { fontSize: 18, fontWeight: '800', color: Colors.primary },
  onlineDot:      { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#22c55e', borderWidth: 2, borderColor: Colors.white },
  chatInfo:       { flex: 1 },
  chatTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName:       { fontSize: 15, fontWeight: '600', color: Colors.text },
  chatNameBold:   { fontWeight: '800' },
  chatTime:       { fontSize: 12, color: Colors.textMuted },
  chatBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatMsg:        { flex: 1, fontSize: 13, color: Colors.textSub, marginRight: 8 },
  chatMsgBold:    { color: Colors.text, fontWeight: '600' },
  badge:          { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText:      { color: 'white', fontSize: 11, fontWeight: '800' },
  empty:          { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyTitle:     { fontSize: 18, fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 8 },
  emptyText:      { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 20 },
});
