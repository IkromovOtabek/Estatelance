import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Image,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useQuery, useMutation } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_POSTS } from '../../apollo/queries';
import { CREATE_POST, TOGGLE_LIKE_POST, ADD_COMMENT } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { Post } from '../../types';
import { useAuth } from '../../hooks/useAuth';

export default function ArticlesScreen() {
  const { user } = useAuth();
  const [createModal, setCreateModal] = useState(false);
  const [expanded, setExpanded]       = useState<string | null>(null);
  const [cTitle, setCTitle]           = useState('');
  const [cBody, setCBody]             = useState('');
  const [commentMap, setCommentMap]   = useState<Record<string, string>>({});

  const { data, loading, refetch } = useQuery(GET_POSTS, { variables: { page: 1, limit: 20 } });
  const [createPost, { loading: creating }] = useMutation(CREATE_POST);
  const [toggleLike]  = useMutation(TOGGLE_LIKE_POST);
  const [addComment]  = useMutation(ADD_COMMENT);

  const posts: Post[] = data?.getPosts ?? [];

  const handleCreate = async () => {
    if (!cTitle.trim() || !cBody.trim()) return;
    try {
      await createPost({ variables: { input: { title: cTitle.trim(), body: cBody.trim() } } });
      setCTitle(''); setCBody('');
      setCreateModal(false);
      refetch();
    } catch {}
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await toggleLike({ variables: { postId }, refetchQueries: ['GetPosts'] });
  };

  const handleComment = async (postId: string) => {
    const text = commentMap[postId]?.trim();
    if (!text || !user) return;
    try {
      await addComment({ variables: { input: { postId, text } }, refetchQueries: ['GetPosts'] });
      setCommentMap(prev => ({ ...prev, [postId]: '' }));
    } catch {}
  };

  const renderPost = ({ item: post }: { item: Post }) => {
    const isLiked    = post.likedByUserIds?.includes(user?._id ?? '');
    const isExpanded = expanded === post._id;
    return (
      <View style={styles.postCard}>
        {post.imageUrl && <Image source={{ uri: post.imageUrl }} style={styles.postImage} />}
        <View style={styles.postBody}>
          <View style={styles.authorRow}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarLetter}>{post.authorName?.[0] ?? '?'}</Text>
            </View>
            <View>
              <Text style={styles.authorName}>{post.authorName}</Text>
              <Text style={styles.postDate}>{post.createdAt?.slice(0, 10)}</Text>
            </View>
          </View>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postText} numberOfLines={isExpanded ? undefined : 3}>{post.body}</Text>
          <TouchableOpacity onPress={() => setExpanded(isExpanded ? null : post._id)}>
            <Text style={styles.readMore}>{isExpanded ? 'Kamroq' : 'Ko\'proq o\'qish'}</Text>
          </TouchableOpacity>

          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionItem} onPress={() => handleLike(post._id)}>
              <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#dc2626' : Colors.textMuted} />
              <Text style={styles.actionCount}>{post.likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => setExpanded(isExpanded ? null : post._id)}>
              <Ionicons name="chatbubble-outline" size={17} color={Colors.textMuted} />
              <Text style={styles.actionCount}>{post.comments.length}</Text>
            </TouchableOpacity>
            <View style={styles.actionItem}>
              <Ionicons name="eye-outline" size={17} color={Colors.textMuted} />
              <Text style={styles.actionCount}>{post.viewCount}</Text>
            </View>
          </View>

          {isExpanded && (
            <View style={styles.commentsSection}>
              {post.comments.map(c => (
                <View key={c._id} style={styles.commentRow}>
                  <View style={styles.avatarTiny}>
                    <Text style={styles.avatarTinyText}>{c.authorName?.[0] ?? '?'}</Text>
                  </View>
                  <View style={styles.commentBubble}>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                </View>
              ))}
              {user && (
                <View style={styles.commentInput}>
                  <TextInput
                    style={styles.commentField}
                    placeholder="Izoh yozing..."
                    placeholderTextColor={Colors.textMuted}
                    value={commentMap[post._id] ?? ''}
                    onChangeText={t => setCommentMap(prev => ({ ...prev, [post._id]: t }))}
                    onSubmitEditing={() => handleComment(post._id)}
                    returnKeyType="send"
                  />
                  <TouchableOpacity onPress={() => handleComment(post._id)}>
                    <Ionicons name="send" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Maqolalar</Text>
          <Text style={styles.headerSub}>Sohaviy yangiliklar</Text>
        </View>
        {user && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModal(true)}>
            <Ionicons name="add" size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {loading && posts.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={renderPost}
        />
      )}

      {/* Create Modal */}
      <Modal visible={createModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Maqola yozish</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.fieldLabel}>Sarlavha *</Text>
              <TextInput style={styles.fieldInput} value={cTitle} onChangeText={setCTitle} placeholder="Maqola sarlavhasi..." placeholderTextColor={Colors.textMuted} />
              <Text style={styles.fieldLabel}>Mazmun *</Text>
              <TextInput style={[styles.fieldInput, { height: 180, textAlignVertical: 'top' }]} value={cBody} onChangeText={setCBody} placeholder="Maqola matni..." placeholderTextColor={Colors.textMuted} multiline />
              <TouchableOpacity style={[styles.btn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>E'lon qilish</Text>}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.bg },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:    { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub:      { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  addBtn:         { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  list:           { paddingHorizontal: 16, paddingBottom: 20 },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  postCard:       { backgroundColor: Colors.white, borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  postImage:      { width: '100%', height: 180 },
  postBody:       { padding: 16 },
  authorRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarSmall:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  avatarLetter:   { fontSize: 15, fontWeight: '800', color: Colors.primary },
  authorName:     { fontSize: 14, fontWeight: '700', color: Colors.text },
  postDate:       { fontSize: 11, color: Colors.textMuted },
  postTitle:      { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  postText:       { fontSize: 14, color: Colors.textSub, lineHeight: 20, marginBottom: 8 },
  readMore:       { fontSize: 13, color: Colors.primary, fontWeight: '600', marginBottom: 10 },
  postActions:    { flexDirection: 'row', gap: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  actionItem:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionCount:    { fontSize: 13, color: Colors.textMuted },
  commentsSection:{ marginTop: 12 },
  commentRow:     { flexDirection: 'row', gap: 8, marginBottom: 8 },
  avatarTiny:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarTinyText: { fontSize: 12, fontWeight: '700', color: Colors.textSub },
  commentBubble:  { flex: 1, backgroundColor: Colors.bg, borderRadius: 10, padding: 8 },
  commentAuthor:  { fontSize: 12, fontWeight: '700', color: Colors.text },
  commentText:    { fontSize: 13, color: Colors.textSub, marginTop: 2 },
  commentInput:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  commentField:   { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: Colors.text, backgroundColor: Colors.bg },
  modalSafe:      { flex: 1, backgroundColor: Colors.white },
  modalHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle:     { fontSize: 18, fontWeight: '800', color: Colors.text },
  modalBody:      { padding: 20 },
  fieldLabel:     { fontSize: 13, fontWeight: '600', color: Colors.textSub, marginBottom: 6 },
  fieldInput:     { borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, marginBottom: 14 },
  btn:            { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText:        { color: 'white', fontWeight: '800', fontSize: 16 },
});
