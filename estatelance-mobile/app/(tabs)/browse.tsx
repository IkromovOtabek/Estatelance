import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_FREELANCERS } from '../../apollo/queries';
import FreelancerCard from '../../components/FreelancerCard';
import { Colors } from '../../constants/colors';
import { User } from '../../types';

export default function BrowseScreen() {
  const [search, setSearch] = useState('');

  const { data, loading, refetch } = useQuery(GET_FREELANCERS, {
    variables: { input: { page: 1, limit: 30, ...(search.trim() ? { searchText: search.trim() } : {}) } },
  });

  const users: User[] = data?.getFreelancers ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Frilanserlar</Text>
        <Text style={styles.headerSub}>{users.length} ta mutaxassis</Text>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Frilanser qidirish..."
          placeholderTextColor={Colors.textMuted}
          value={search} onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => refetch()}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={u => u._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />}
          renderItem={({ item }) => (
            <FreelancerCard user={item} onPress={() => router.push(`/profile/${item._id}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Frilanser topilmadi</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.bg },
  header:      { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub:   { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  list:        { paddingHorizontal: 16, paddingBottom: 20 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:       { alignItems: 'center', paddingTop: 60 },
  emptyText:   { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
});
