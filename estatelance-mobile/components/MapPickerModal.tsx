import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ActivityIndicator, Alert, TextInput, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
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

// ─── Leaflet HTML ─────────────────────────────────────────────────────────────
function buildMapHtml(lat: number, lng: number, markerLat?: number, markerLng?: number) {
  const markerJs = markerLat != null
    ? `
      var marker = L.marker([${markerLat}, ${markerLng}], { icon: pinIcon }).addTo(map);
    `
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-zoom { display: none; }
    .custom-pin {
      width: 28px; height: 28px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 12px rgba(79,70,229,0.5);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${lat}, ${lng}],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    var pinIcon = L.divIcon({
      className: '',
      html: '<div class="custom-pin"></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    var marker = null;
    ${markerJs}

    map.on('click', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;

      if (marker) { map.removeLayer(marker); }
      marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);

      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pick',
        latitude: lat,
        longitude: lng,
      }));
    });

    function flyTo(lat, lng) {
      if (marker) { map.removeLayer(marker); }
      marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
      map.flyTo([lat, lng], 16, { duration: 1.2 });
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'pick',
        latitude: lat,
        longitude: lng,
      }));
    }

    window.addEventListener('message', function(e) {
      try {
        var msg = JSON.parse(e.data);
        if (msg.type === 'flyTo') { flyTo(msg.lat, msg.lng); }
      } catch(err) {}
    });
  </script>
</body>
</html>`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MapPickerModal({ visible, initial, onConfirm, onClose }: Props) {
  const webRef = useRef<WebView>(null);

  const [marker, setMarker]     = useState<PickedAddress | null>(initial ?? null);
  const [loading, setLoading]   = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [search, setSearch]     = useState('');
  const [searching, setSearching] = useState(false);
  const [suggests, setSuggests] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const searchTimer             = useRef<any>(null);

  const centerLat = initial?.latitude  ?? 41.2995;
  const centerLng = initial?.longitude ?? 69.2401;
  const html = buildMapHtml(centerLat, centerLng, initial?.latitude, initial?.longitude);

  useEffect(() => {
    if (!visible) {
      setSearch('');
      setSuggests([]);
      setMarker(initial ?? null);
    }
  }, [visible]);

  // ── Reverse geocode ────────────────────────────────────────────────────────
  const reverseGeocode = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=uz`,
        { headers: { 'User-Agent': 'BuFuApp/1.0' } }
      );
      const json = await res.json();
      if (json?.display_name) {
        const parts = json.display_name.split(',').slice(0, 3).join(',');
        return parts;
      }
    } catch {}
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const r = results[0];
      if (!r) return undefined;
      return [r.street, r.district, r.city].filter(Boolean).join(', ') || undefined;
    } catch {}
    return undefined;
  };

  // ── WebView message ────────────────────────────────────────────────────────
  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'pick') {
        setGeocoding(true);
        const name = await reverseGeocode(msg.latitude, msg.longitude);
        setMarker({ latitude: msg.latitude, longitude: msg.longitude, name });
        setGeocoding(false);
      }
    } catch {}
  };

  // ── Current location ───────────────────────────────────────────────────────
  const handleMyLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ruxsat kerak', 'Sozlamalardan joylashuv ruxsatini bering.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      webRef.current?.injectJavaScript(
        `flyTo(${latitude}, ${longitude}); true;`
      );

      const name = await reverseGeocode(latitude, longitude);
      setMarker({ latitude, longitude, name });
    } catch {
      Alert.alert('Xato', 'Joylashuv aniqlanmadi.');
    } finally {
      setLoading(false);
    }
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearchChange = (text: string) => {
    setSearch(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSuggests([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&accept-language=uz`,
          { headers: { 'User-Agent': 'BuFuApp/1.0' } }
        );
        const data = await res.json();
        setSuggests(data ?? []);
      } catch {
        setSuggests([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  };

  const handleSuggestPick = (item: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name.split(',').slice(0, 3).join(',');
    webRef.current?.injectJavaScript(`flyTo(${lat}, ${lng}); true;`);
    setMarker({ latitude: lat, longitude: lng, name });
    setSearch(name);
    setSuggests([]);
  };

  // ── Confirm ────────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!marker) {
      Alert.alert('Manzil tanlang', 'Xaritada bir joyga bosing yoki qidiring.');
      return;
    }
    onConfirm(marker);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.safe} edges={['top']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Manzilni tanlang</Text>
          <TouchableOpacity
            style={[styles.confirmBtn, !marker && { opacity: 0.5 }]}
            onPress={handleConfirm}
            disabled={!marker}
          >
            <Text style={styles.confirmText}>Tasdiqlash</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ── */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Manzil qidirish..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
            {searching
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : search
                ? <TouchableOpacity onPress={() => { setSearch(''); setSuggests([]); }}>
                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                : null
            }
          </View>

          {suggests.length > 0 && (
            <View style={styles.suggestList}>
              {suggests.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.suggestItem, i < suggests.length - 1 && styles.suggestBorder]}
                  onPress={() => handleSuggestPick(s)}
                >
                  <Ionicons name="location-outline" size={15} color={Colors.primary} />
                  <Text style={styles.suggestText} numberOfLines={2}>
                    {s.display_name.split(',').slice(0, 3).join(',')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Map ── */}
        <View style={styles.mapWrap}>
          <WebView
            ref={webRef}
            style={styles.map}
            source={{ html }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
          />

          {/* My location button */}
          <TouchableOpacity
            style={styles.myLocBtn}
            onPress={handleMyLocation}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color={Colors.primary} />
              : <Ionicons name="locate" size={22} color={Colors.primary} />
            }
          </TouchableOpacity>

          {/* Geocoding overlay */}
          {geocoding && (
            <View style={styles.geocodingOverlay}>
              <View style={styles.geocodingPill}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.geocodingText}>Manzil aniqlanmoqda...</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Address bar ── */}
        <SafeAreaView edges={['bottom']} style={styles.addressBar}>
          {marker ? (
            <View style={styles.addressContent}>
              <View style={styles.addressIcon}>
                <Ionicons name="location" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addressLabel}>Tanlangan manzil</Text>
                <Text style={styles.addressText} numberOfLines={2}>
                  {marker.name
                    ? marker.name
                    : `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.confirmBtnBottom}
                onPress={handleConfirm}
              >
                <Ionicons name="checkmark" size={18} color="white" />
                <Text style={styles.confirmBtnBottomText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addressContent}>
              <View style={[styles.addressIcon, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="hand-left-outline" size={20} color={Colors.textMuted} />
              </View>
              <Text style={styles.addressPlaceholder}>
                Xaritaga bosing yoki yuqoridan qidiring
              </Text>
            </View>
          )}
        </SafeAreaView>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: Colors.white },
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.white },
  closeBtn:           { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  title:              { fontSize: 16, fontWeight: '800', color: Colors.text },
  confirmBtn:         { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  confirmText:        { color: 'white', fontWeight: '700', fontSize: 14 },

  searchWrap:         { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: Colors.white, zIndex: 10 },
  searchBar:          { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.bg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 8, borderWidth: 1, borderColor: Colors.border },
  searchInput:        { flex: 1, fontSize: 15, color: Colors.text },
  suggestList:        { position: 'absolute', top: 62, left: 12, right: 12, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, zIndex: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  suggestItem:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12 },
  suggestBorder:      { borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestText:        { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },

  mapWrap:            { flex: 1, position: 'relative' },
  map:                { flex: 1 },
  myLocBtn:           { position: 'absolute', right: 16, bottom: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 },
  geocodingOverlay:   { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  geocodingPill:      { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.white, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  geocodingText:      { fontSize: 13, fontWeight: '600', color: Colors.text },

  addressBar:         { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  addressContent:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addressIcon:        { width: 40, height: 40, borderRadius: 12, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  addressLabel:       { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 },
  addressText:        { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  addressPlaceholder: { flex: 1, fontSize: 14, color: Colors.textMuted },
  confirmBtnBottom:   { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  confirmBtnBottomText: { color: 'white', fontWeight: '800', fontSize: 14 },
});
