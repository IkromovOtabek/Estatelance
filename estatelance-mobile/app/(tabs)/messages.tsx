import React, { useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import SwipeWrapper from '../../components/SwipeWrapper';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { GET_MY_CONVERSATIONS } from '../../apollo/queries';
import { Colors } from '../../constants/colors';
import { safeImageUri } from '../../libs/safeImage';
import { useAuth } from '../../hooks/useAuth';
import { Message } from '../../types';

interface ConvSummary {
  otherUserId: string;
  otherUserName: string;
  otherUsername?: string;
  otherUserAvatar?: string;
  lastMessageText: string;
  lastMessageTime?: string;
  isUnread: boolean;
  iMine: boolean;
}

function buildConversations(messages: Message[], myId: string): ConvSummary[] {
  return messages.map((msg) => {
    const iAmSender = msg.senderId === myId;
    return {
      otherUserId:     iAmSender ? msg.receiverId       : msg.senderId,
      otherUserName:   iAmSender ? msg.receiverName     : msg.senderName,
      otherUsername:   iAmSender ? msg.receiverUsername : msg.senderUsername,
      otherUserAvatar: iAmSender ? msg.receiverAvatar   : msg.senderAvatar,
      lastMessageText: msg.text,
      lastMessageTime: msg.createdAt,
      isUnread:        !msg.isRead && !iAmSender,
      iMine:           iAmSender,
    };
  });
}

function safeDate(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (diffDays === 1) return 'Kecha';
    if (diffDays < 7) return ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'][d.getDay()];
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch { return ''; }
}

export default function MessagesScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    safe:           { flex: 1, backgroundColor: Colors.bg },
    header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    backBtn:        { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    headerTitle:    { fontSize: 17, fontWeight: '800', color: Colors.text },
    searchBox:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: 16, paddingVertical: 10 },
    searchInput:    { flex: 1, fontSize: 15, color: Colors.text },
    center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty:          { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyTitle:     { fontSize: 17, fontWeight: '800', color: Colors.text, marginTop: 16 },
    emptyDesc:      { fontSize: 13, color: Colors.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    separator:      { height: 1, backgroundColor: Colors.border },
    chatRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.white },
    avatarWrap:     { position: 'relative', marginRight: 12 },
    avatar:         { width: 48, height: 48, borderRadius: 24 },
    avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    avatarText:     { fontSize: 16, fontWeight: '900', color: Colors.primary },
    unreadDot:      { position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#dc2626', borderWidth: 2, borderColor: Colors.white },
    chatInfo:       { flex: 1 },
    chatTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    chatName:       { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
    chatNameBold:   { fontWeight: '800' },
    chatTime:       { fontSize: 11, color: Colors.textMuted },
    chatBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    chatMsg:        { fontSize: 13, color: Colors.textSub, flex: 1, marginRight: 8 },
    chatMsgBold:    { fontWeight: '700', color: Colors.primary },
    badge:          { backgroundColor: Colors.primary, borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    badgeText:      { color: 'white', fontSize: 10, fontWeight: '800' },
  }), [themeKey]);
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const { data, loading, refetch } = useQuery(GET_MY_CONVERSATIONS, {
    skip: !user,
    fetchPolicy: 'cache-and-network',
    pollInterval: 8000,
  });

  const rawMessages: Message[] = data?.getMyConversations ?? [];
  const conversations = buildConversations(rawMessages, user?._id ?? '');
  const filtered = search
    ? conversations.filter(c => c.otherUserName.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (<SwipeWrapper>
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Xabarlar</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Qidirish..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && conversations.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={52} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Yozishmalar yo'q</Text>
          <Text style={styles.emptyDesc}>
            Frilanser profiliga kiring va "Xabar" tugmasini bosing
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={c => c.otherUserId}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const initials = item.otherUserName
              .split(' ')
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();
            return (
              <TouchableOpacity
                style={styles.chatRow}
                activeOpacity={0.75}
                onPress={() =>
                  router.push(
                    `/messages/${item.otherUserId}?name=${encodeURIComponent(item.otherUserName)}&avatar=${encodeURIComponent(item.otherUserAvatar ?? '')}` as any
                  )
                }
              >
                <View style={styles.avatarWrap}>
                  {safeImageUri(item.otherUserAvatar) ? (
                    <Image source={{ uri: safeImageUri(item.otherUserAvatar) }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                  )}
                  {item.isUnread && <View style={styles.unreadDot} />}
                </View>

                <View style={styles.chatInfo}>
                  <View style={styles.chatTop}>
                    <Text
                      style={[styles.chatName, item.isUnread && styles.chatNameBold]}
                      numberOfLines={1}
                    >
                      {item.otherUserName}
                    </Text>
                    <Text style={[styles.chatTime, item.isUnread && { color: Colors.primary }]}>
                      {safeDate(item.lastMessageTime)}
                    </Text>
                  </View>
                  <View style={styles.chatBottom}>
                    <Text
                      style={[styles.chatMsg, item.isUnread && styles.chatMsgBold]}
                      numberOfLines={1}
                    >
                      {item.lastMessageText}
                    </Text>
                    {item.isUnread && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>1</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  </SwipeWrapper>);
}

