import React, { useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import SwipeWrapper from '../../components/SwipeWrapper';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useFavorites } from '../../hooks/useFavorites';
import JobCard from '../../components/JobCard';

export default function FavoritesScreen() {
  const { themeKey } = useTheme();
  const styles = useMemo(() => StyleSheet.create({
    safe:        { flex: 1, backgroundColor: Colors.bg },
    header:      { paddingHorizontal: 16, paddingVertical: 12 },
    title:       { fontSize: 22, fontWeight: '900', color: Colors.text },
    sub:         { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    list:        { paddingHorizontal: 16, paddingBottom: 20 },
    empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
    emptyTitle:  { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 16, marginBottom: 8 },
    emptyDesc:   { fontSize: 14, color: Colors.textSub, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    browseBtn:   { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 32 },
    browseBtnText:{ color: 'white', fontWeight: '800', fontSize: 15 },
  }), [themeKey]);
  const { favorites } = useFavorites();

  return (<SwipeWrapper>
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Sevimlilar</Text>
        <Text style={styles.sub}>{favorites.length} ta ish saqlangan</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Sevimlilar bo'sh</Text>
          <Text style={styles.emptyDesc}>Ishlarni saqlash uchun yurak belgisini bosing</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.browseBtnText}>Ishlarni ko'rish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={j => j._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <JobCard
              job={item}
              onPress={() => router.push(`/jobs/${item._id}` as any)}
            />
          )}
        />
      )}
    </SafeAreaView>
  </SwipeWrapper>);
}

