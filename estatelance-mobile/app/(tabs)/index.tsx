import React, { useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import SwipeWrapper from '../../components/SwipeWrapper';
import {
  View, Text, FlatList, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GET_JOBS, GET_UNREAD_COUNT } from '../../apollo/queries';
import JobCard from '../../components/JobCard';
import AnnouncementsBanner from '../../components/AnnouncementsBanner';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const CATEGORIES = [
  { value: '',           label: 'Hammasi',    icon: 'apps',          color: '#6366f1' },
  { value: 'VISUALS',    label: 'Foto & Dron',icon: 'camera',        color: '#0891b2' },
  { value: 'RENDERING',  label: '3D Render',  icon: 'cube',          color: '#7c3aed' },
  { value: 'LEGAL',      label: 'Yuridik',    icon: 'document-text', color: '#16a34a' },
  { value: 'REPAIR',     label: "Ta'mirlash", icon: 'construct',     color: '#ea580c' },
  { value: 'DESIGN',     label: 'Dizayn',     icon: 'color-palette', color: '#db2777' },
  { value: 'IT',         label: 'IT',         icon: 'code-slash',    color: '#0284c7' },
  { value: 'INSPECTION', label: 'Baholash',   icon: 'bar-chart',     color: '#b45309' },
  { value: 'MARKETING',  label: 'Marketing',  icon: 'megaphone',     color: '#7c3aed' },
  { value: 'OTHER',      label: 'Boshqa',     icon: 'grid',          color: '#64748b' },
] as const;

export default function JobsScreen() {
  const { themeKey } = useTheme();
  const { user } = useAuth();
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');

  const { data: notifData } = useQuery(GET_UNREAD_COUNT, {
    skip: !user,
    pollInterval: 30_000,
    fetchPolicy: 'cache-and-network',
  });
  const unreadNotif = notifData?.getUnreadNotificationCount ?? 0;

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

  const styles = useMemo(() => StyleSheet.create({
    safe:          { flex: 1, backgroundColor: Colors.bg },
    header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    headerTitle:   { fontSize: 22, fontWeight: '900', color: Colors.text },
    headerSub:     { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    iconBtn:       { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
    badge:         { position: 'absolute', top: -4, right: -4, backgroundColor: '#dc2626', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.white },
    badgeText:     { color: 'white', fontSize: 9, fontWeight: '800' },
    searchBox:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, marginHorizontal: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
    searchInput:   { flex: 1, fontSize: 15, color: Colors.text },
    catList:       { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
    catBtn:        { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 22, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
    catIconWrap:   { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    catText:       { fontSize: 13, fontWeight: '700', color: Colors.textSub },
    catTextActive: { color: 'white' },
    list:          { paddingHorizontal: 16, paddingBottom: 20 },
    center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty:         { alignItems: 'center', paddingTop: 60 },
    emptyText:     { fontSize: 16, color: Colors.textMuted, marginTop: 12 },
  }), [themeKey]);

  return (<SwipeWrapper>
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Ish e'lonlari</Text>
          <Text style={styles.headerSub}>{jobs.length} ta ish topildi</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/notifications')}>
            <Ionicons name="notifications-outline" size={22} color={Colors.text} />
            {unreadNotif > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotif > 99 ? '99+' : unreadNotif}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
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
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.catList}
        renderItem={({ item }) => {
          const isActive = category === item.value;
          return (
            <TouchableOpacity
              style={[
                styles.catBtn,
                isActive && { backgroundColor: item.color, borderColor: item.color },
              ]}
              onPress={() => setCategory(item.value)}
              activeOpacity={0.75}
            >
              <View style={[
                styles.catIconWrap,
                { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : item.color + '18' },
              ]}>
                <Ionicons
                  name={item.icon as any}
                  size={14}
                  color={isActive ? 'white' : item.color}
                />
              </View>
              <Text style={[styles.catText, isActive && styles.catTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
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
          ListHeaderComponent={<AnnouncementsBanner />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Ish topilmadi</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  </SwipeWrapper>);
}

