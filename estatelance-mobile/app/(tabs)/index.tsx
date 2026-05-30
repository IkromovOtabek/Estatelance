import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_JOBS } from '../../apollo/queries';
import JobCard from '../../components/JobCard';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';

const CATEGORIES = [
  { value: '',             label: 'Hammasi' },
  { value: 'PHOTOGRAPHY',  label: '📸 Foto' },
  { value: 'RENDERING',    label: '🏠 3D' },
  { value: 'LEGAL',        label: '⚖️ Yuridik' },
  { value: 'REPAIR',       label: '🔧 Ta\'mirlash' },
  { value: 'CLEANING',     label: '🧹 Tozalash' },
  { value: 'DESIGN',       label: '🎨 Dizayn' },
  { value: 'VALUATION',    label: '📊 Baholash' },
];

export default function JobsScreen() {
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');

  const { data, loading, refetch } = useQuery(GET_JOBS, {
    variables: {
      input: {
        page: 1, limit: 30,
        ...(category ? { category } : {}),
        ...(search.trim() ? { searchText: search.trim() } : {}),
      },
    },
  });

  const jobs: Job[] = data?.getJobs ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ish e'lonlari</Text>
          <Text style={styles.headerSub}>{jobs.length} ta ish topildi</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/my-works')}>
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Ish qidirish..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => refetch()}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={c => c.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, category === item.value && styles.catBtnActive]}
            onPress={() => setCategory(item.value)}
          >
            <Text style={[styles.catText, category === item.value && styles.catTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Jobs */}
      {loading && jobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={j => j._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <JobCard job={item} onPress={() => router.push(`/jobs/${item._id}`)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Ish topilmadi</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: Colors.text },
  headerSub:     { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  addBtn:        { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  searchBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  searchInput:   { flex: 1, fontSize: 15, color: Colors.text },
  catList:       { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  catBtn:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  catBtnActive:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText:       { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  catTextActive: { color: 'white' },
  list:          { paddingHorizontal: 16, paddingBottom: 20 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:         { alignItems: 'center', paddingTop: 60 },
  emptyText:     { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
});
