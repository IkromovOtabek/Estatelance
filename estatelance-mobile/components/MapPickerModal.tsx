import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, MapPressEvent, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

export interface PickedAddress {
  latitude: number;
  longitude: number;
  name?: string;
}

interface Props {
  visible: boolean;
  initial?: PickedAddress | null;
  onConfirm: (addr: PickedAddress) => void;
  onClose: () => void;
}

const DEFAULT_REGION: Region = {
  latitude: 41.2995,
  longitude: 69.2401,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapPickerModal({ visible, initial, onConfirm, onClose }: Props) {
  const [marker, setMarker] = useState<PickedAddress | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = initial
    ? { latitude: initial.latitude, longitude: initial.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = results[0];
      if (!r) return undefined;
      const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
      return parts.join(', ') || undefined;
    } catch {
      return undefined;
    }
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLoading(true);
    const name = await reverseGeocode(latitude, longitude);
    setMarker({ latitude, longitude, name });
    setLoading(false);
  };

  const handleMyLocation = async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ruxsat kerak', 'Joylashuv ruxsati berilmadi.');
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const { latitude, longitude } = loc.coords;
    const name = await reverseGeocode(latitude, longitude);
    setMarker({ latitude, longitude, name });
    mapRef.current?.animateToRegion(
      { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400,
    );
    setLoading(false);
  };

  const handleConfirm = () => {
    if (!marker) {
      Alert.alert('Manzil tanlang', 'Xaritada bir joyga bosing.');
      return;
    }
    onConfirm(marker);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Manzilni tanlang</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>Tasdiqlash</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onPress={handleMapPress}
            showsUserLocation
          >
            {marker && (
              <Marker coordinate={{ latitude: marker.latitude, longitude: marker.longitude }} />
            )}
          </MapView>

          <TouchableOpacity style={styles.myLocBtn} onPress={handleMyLocation} disabled={loading}>
            <Ionicons name="locate" size={22} color={Colors.primary} />
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          )}
        </View>

        {marker?.name && (
          <View style={styles.addressBar}>
            <Ionicons name="location-outline" size={16} color={Colors.primary} />
            <Text style={styles.addressText} numberOfLines={2}>{marker.name}</Text>
          </View>
        )}
        {marker && !marker.name && (
          <View style={styles.addressBar}>
            <Ionicons name="location-outline" size={16} color={Colors.textSub} />
            <Text style={styles.addressText}>
              {marker.latitude.toFixed(5)}, {marker.longitude.toFixed(5)}
            </Text>
          </View>
        )}
        {!marker && (
          <View style={styles.addressBar}>
            <Ionicons name="hand-left-outline" size={16} color={Colors.textMuted} />
            <Text style={[styles.addressText, { color: Colors.textMuted }]}>Xaritada bosib manzil tanlang</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: Colors.white },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:          { fontSize: 17, fontWeight: '800', color: Colors.text },
  confirmBtn:     { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  confirmText:    { color: 'white', fontWeight: '700', fontSize: 14 },
  mapContainer:   { flex: 1, position: 'relative' },
  map:            { flex: 1 },
  myLocBtn:       { position: 'absolute', right: 16, bottom: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
  addressBar:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  addressText:    { flex: 1, fontSize: 14, color: Colors.text, lineHeight: 20 },
});
