import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Modal, ScrollView, Dimensions,
} from 'react-native';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useThemeContext';
import { Colors } from '../constants/colors';
import { GET_ACTIVE_ANNOUNCEMENTS } from '../apollo/queries';
import { safeImageUri } from '../libs/safeImage';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  imageUrl?: string;
  announcementType: string; // ANNOUNCEMENT | ADVERTISEMENT
  createdAt?: string;
}

const { width } = Dimensions.get('window');
const CARD_W = width - 32;

export default function AnnouncementsBanner() {
  const { themeKey } = useTheme();
  const { data } = useQuery(GET_ACTIVE_ANNOUNCEMENTS, {
    fetchPolicy: 'cache-and-network',
    pollInterval: 60_000,
  });
  const [active, setActive] = useState<Announcement | null>(null);

  const items: Announcement[] = data?.getActiveAnnouncements ?? [];

  const styles = useMemo(() => StyleSheet.create({
    wrap:        { marginBottom: 8 },
    card: {
      width: CARD_W,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    cardAd:      { borderColor: '#c4b5fd' },
    image:       { width: '100%', height: 130, backgroundColor: Colors.bg },
    body:        { padding: 14 },
    typeRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
    typeBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
    typeText:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
    title:       { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    text:        { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
    more:        { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 8 },
    dotsRow:     { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
    dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
    // modal
    backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet:       { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
    sheetImg:    { width: '100%', height: 200, backgroundColor: Colors.bg },
    sheetBody:   { padding: 20 },
    sheetTitle:  { fontSize: 20, fontWeight: '900', color: Colors.text, marginBottom: 10 },
    sheetText:   { fontSize: 15, color: Colors.textSub, lineHeight: 23 },
    closeBtn:    { position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  }), [themeKey]);

  if (items.length === 0) return null;

  const renderBadge = (type: string) => {
    const isAd = type === 'ADVERTISEMENT';
    return (
      <View style={[styles.typeBadge, { backgroundColor: isAd ? '#f5f3ff' : '#eff6ff' }]}>
        <Ionicons name={isAd ? 'megaphone' : 'newspaper'} size={11} color={isAd ? '#7c3aed' : '#2563eb'} />
        <Text style={[styles.typeText, { color: isAd ? '#7c3aed' : '#2563eb' }]}>
          {isAd ? 'REKLAMA' : "E'LON"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
      >
        {items.map((a) => {
          const isAd = a.announcementType === 'ADVERTISEMENT';
          const img = safeImageUri(a.imageUrl);
          return (
            <TouchableOpacity
              key={a._id}
              style={[styles.card, isAd && styles.cardAd]}
              activeOpacity={0.9}
              onPress={() => setActive(a)}
            >
              {img ? <Image source={{ uri: img }} style={styles.image} resizeMode="cover" /> : null}
              <View style={styles.body}>
                <View style={styles.typeRow}>{renderBadge(a.announcementType)}</View>
                <Text style={styles.title} numberOfLines={1}>{a.title}</Text>
                <Text style={styles.text} numberOfLines={2}>{a.body}</Text>
                <Text style={styles.more}>Batafsil →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((a) => <View key={a._id} style={styles.dot} />)}
        </View>
      )}

      {/* Detail modal */}
      <Modal visible={!!active} transparent animationType="slide" onRequestClose={() => setActive(null)}>
        <TouchableOpacity activeOpacity={1} style={styles.backdrop} onPress={() => setActive(null)}>
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {safeImageUri(active?.imageUrl) ? (
                <View>
                  <Image source={{ uri: safeImageUri(active?.imageUrl) }} style={styles.sheetImg} resizeMode="cover" />
                </View>
              ) : null}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setActive(null)}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.sheetBody}>
                {active ? renderBadge(active.announcementType) : null}
                <Text style={[styles.sheetTitle, { marginTop: 10 }]}>{active?.title}</Text>
                <Text style={styles.sheetText}>{active?.body}</Text>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
