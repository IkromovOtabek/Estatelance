import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import { GET_CONVERSATION } from '../../apollo/queries';
import { SEND_MESSAGE, MARK_MESSAGES_AS_READ } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { safeImageUri } from '../../libs/safeImage';
import { useAuth } from '../../hooks/useAuth';
import { Message } from '../../types';

function safeTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch { return ''; }
}

export default function ChatScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => createStyles(), [themeKey]);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const params = useLocalSearchParams<{ name?: string; avatar?: string }>();
  const otherName   = params.name   ? decodeURIComponent(params.name)   : 'Foydalanuvchi';
  const otherAvatar = params.avatar ? decodeURIComponent(params.avatar) : '';

  const { user } = useAuth();
  const [text, setText] = useState('');
  const flatRef = useRef<FlatList>(null);

  const { data, loading } = useQuery(GET_CONVERSATION, {
    variables: { otherUserId: userId },
    skip: !userId || !user,
    fetchPolicy: 'cache-and-network',
    pollInterval: 4000,
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
  const [markRead] = useMutation(MARK_MESSAGES_AS_READ);

  useEffect(() => {
    if (userId) markRead({ variables: { otherUserId: userId } }).catch(() => {});
  }, [userId]);

  const messages: Message[] = data?.getConversation ?? [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !userId) return;
    setText('');
    try {
      await sendMessage({
        variables: { input: { receiverId: userId, text: trimmed } },
        refetchQueries: ['GetConversation', 'GetMyConversations'],
      });
    } catch {
      setText(trimmed);
    }
  };

  const initials = otherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUser}
          onPress={() => router.push(`/profile/${userId}`)}
          activeOpacity={0.75}
        >
          {safeImageUri(otherAvatar) ? (
            <Image source={{ uri: safeImageUri(otherAvatar) }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarFallback}>
              <Text style={styles.headerAvatarText}>{initials}</Text>
            </View>
          )}
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push(`/profile/${userId}`)}
        >
          <Ionicons name="person-outline" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages list */}
        {loading && messages.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m._id}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Ionicons name="hand-left-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyChatText}>Hali xabar yo'q. Salomlashing!</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isMine = item.senderId === user?._id;
              const prevItem = messages[index - 1];
              const showAvatar = !isMine && (!prevItem || prevItem.senderId !== item.senderId);

              return (
                <View style={[styles.msgRow, isMine ? styles.msgRowMine : styles.msgRowOther]}>
                  {/* Other person avatar placeholder */}
                  {!isMine && (
                    <View style={styles.avatarSpace}>
                      {showAvatar && (
                        safeImageUri(otherAvatar) ? (
                          <Image source={{ uri: safeImageUri(otherAvatar) }} style={styles.msgAvatar} />
                        ) : (
                          <View style={styles.msgAvatarFallback}>
                            <Text style={styles.msgAvatarText}>{initials[0]}</Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
                      {item.text}
                    </Text>
                    <View style={styles.bubbleMeta}>
                      <Text style={[styles.bubbleTime, isMine && styles.bubbleTimeMine]}>
                        {safeTime(item.createdAt)}
                      </Text>
                      {isMine && (
                        <Ionicons
                          name={item.isRead ? 'checkmark-done' : 'checkmark'}
                          size={12}
                          color={item.isRead ? '#a5b4fc' : 'rgba(255,255,255,0.6)'}
                          style={{ marginLeft: 3 }}
                        />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            placeholder="Xabar yozing..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator size="small" color="white" />
              : <Ionicons name="send" size={18} color="white" />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = () => StyleSheet.create({
  safe:                { flex: 1, backgroundColor: Colors.bg },
  header:              { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 8 },
  backBtn:             { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  headerUser:          { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar:        { width: 36, height: 36, borderRadius: 18 },
  headerAvatarFallback:{ width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  headerAvatarText:    { fontSize: 13, fontWeight: '900', color: Colors.primary },
  headerName:          { fontSize: 15, fontWeight: '800', color: Colors.text, flex: 1 },
  profileBtn:          { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  center:              { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList:             { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  emptyChat:           { alignItems: 'center', paddingTop: 60 },
  emptyChatText:       { fontSize: 14, color: Colors.textMuted, marginTop: 12 },
  msgRow:              { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 2 },
  msgRowMine:          { justifyContent: 'flex-end' },
  msgRowOther:         { justifyContent: 'flex-start' },
  avatarSpace:         { width: 28, marginRight: 6, alignItems: 'center', justifyContent: 'flex-end' },
  msgAvatar:           { width: 26, height: 26, borderRadius: 13 },
  msgAvatarFallback:   { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  msgAvatarText:       { fontSize: 10, fontWeight: '900', color: Colors.primary },
  bubble:              { maxWidth: '72%', paddingHorizontal: 13, paddingTop: 8, paddingBottom: 6, borderRadius: 18 },
  bubbleMine:          { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleOther:         { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText:          { fontSize: 14, color: Colors.text, lineHeight: 20 },
  bubbleTextMine:      { color: 'white' },
  bubbleMeta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  bubbleTime:          { fontSize: 10, color: Colors.textMuted },
  bubbleTimeMine:      { color: 'rgba(255,255,255,0.65)' },
  inputWrap:           { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  input:               { flex: 1, backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, fontSize: 15, color: Colors.text, maxHeight: 120 },
  sendBtn:             { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:     { backgroundColor: '#c7d2fe' },
});
