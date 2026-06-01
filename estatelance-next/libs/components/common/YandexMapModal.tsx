import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogTitle,
  IconButton, CircularProgress, Box, Typography,
} from '@mui/material';
import { X, MagnifyingGlass, MapPin, CheckCircle, NavigationArrow } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (address: string) => void;
  initialAddress?: string;
}

// ── Nominatim search ─────────────────────────────────────────────────────────
async function nominatimSearch(query: string): Promise<{ address: string; lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&accept-language=uz`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'uz' } });
    const data = await res.json();
    if (!data.length) return null;
    return { address: data[0].display_name, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { return null; }
}

// ── Nominatim reverse geocode ────────────────────────────────────────────────
async function nominatimReverse(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=uz`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'uz' } });
    const data = await res.json();
    return data.display_name || '';
  } catch { return ''; }
}

// ── Nominatim suggest (autocomplete) ────────────────────────────────────────
export async function getYandexSuggests(query: string): Promise<string[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&accept-language=uz`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'uz' } });
    const data = await res.json();
    return data.map((d: any) => d.display_name as string);
  } catch { return []; }
}

export default function MapModal({ open, onClose, onSelect, initialAddress }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggests, setSuggests] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [locating, setLocating] = useState(false);
  const suggestTimer = useRef<any>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedAddress(initialAddress || '');
    setSearchQuery('');
    setSuggests([]);
    setSearchError('');
    setLoading(true);

    // Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      leafletRef.current = L.default ?? L;
      setLoading(false);
      setTimeout(() => initMap(L.default ?? L), 80);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [open]);

  function placeMarker(L: any, lat: number, lon: number) {
    if (!mapRef.current) return;
    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;border-radius:50% 50% 50% 0;
        background:linear-gradient(135deg,#6366f1,#818cf8);
        border:3px solid white;
        box-shadow:0 2px 8px rgba(99,102,241,0.5);
        transform:rotate(-45deg);
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
    if (markerRef.current) markerRef.current.remove();
    markerRef.current = L.marker([lat, lon], { icon }).addTo(mapRef.current);
    mapRef.current.flyTo([lat, lon], 15, { duration: 0.8 });
  }

  function initMap(L: any) {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [41.2995, 69.2401],
      zoom: 12,
      zoomControl: true,
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Click → marker + reverse geocode
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      placeMarker(L, lat, lng);
      const addr = await nominatimReverse(lat, lng);
      if (addr) setSelectedAddress(addr);
    });

    // If initial address → geocode it
    if (initialAddress) {
      nominatimSearch(initialAddress).then((r) => {
        if (r) placeMarker(L, r.lat, r.lon);
      });
    }
  }

  function handleSearchInput(val: string) {
    setSearchQuery(val);
    setSearchError('');
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (val.trim().length < 2) { setSuggests([]); return; }
    suggestTimer.current = setTimeout(async () => {
      const results = await getYandexSuggests(val);
      setSuggests(results);
    }, 350);
  }

  async function selectSuggest(addr: string) {
    setSuggests([]);
    setSearchQuery(addr);
    setSearching(true);
    const r = await nominatimSearch(addr);
    setSearching(false);
    if (!r) { setSearchError('Manzil topilmadi'); return; }
    placeMarker(leafletRef.current, r.lat, r.lon);
    setSelectedAddress(r.address);
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setSearchError("Brauzeringiz geolokatsiyani qo'llab-quvvatlamaydi.");
      return;
    }
    setLocating(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        placeMarker(leafletRef.current, lat, lon);
        const addr = await nominatimReverse(lat, lon);
        if (addr) {
          setSelectedAddress(addr);
          setSearchQuery(addr);
        }
        setLocating(false);
      },
      () => {
        setSearchError("Joylashuvni aniqlab bo'lmadi. Ruxsatni tekshiring.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSuggests([]);
    setSearchError('');
    setSearching(true);
    const r = await nominatimSearch(searchQuery);
    setSearching(false);
    if (!r) { setSearchError("Manzil topilmadi. Aniqroq yozing."); return; }
    placeMarker(leafletRef.current, r.lat, r.lon);
    setSelectedAddress(r.address);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          overflow: 'hidden',
          m: 2,
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ p: 0 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 1.8,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MapPin size={18} color="white" weight="fill" />
            <Typography fontWeight={700} fontSize={14} color="white">
              Xaritadan manzil tanlang
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose}
            sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search */}
        <Box sx={{
          px: 2, py: 1.5, position: 'relative', zIndex: 20,
          bgcolor: isDark ? '#0f172a' : '#f8fafc',
          borderBottom: suggests.length === 0 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
        }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box sx={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 0.8, borderRadius: 2,
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}>
              <MagnifyingGlass size={16} color={isDark ? '#64748b' : '#94a3b8'} />
              <input
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                placeholder="Manzil yozing... (masalan: Toshkent, Chilonzor)"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, flex: 1, color: isDark ? '#f1f5f9' : '#0f172a',
                }}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSuggests([]); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#94a3b8' }}>
                  <X size={14} />
                </button>
              )}
            </Box>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              style={{
                padding: '0 18px', borderRadius: 8, border: 'none', flexShrink: 0,
                cursor: searching || !searchQuery.trim() ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                color: 'white', fontWeight: 700, fontSize: 13,
                display: 'flex', alignItems: 'center', gap: 6,
                opacity: searching || !searchQuery.trim() ? 0.6 : 1,
              }}
            >
              {searching
                ? <CircularProgress size={13} sx={{ color: 'white' }} />
                : <MagnifyingGlass size={14} color="white" weight="bold" />}
              Qidirish
            </button>
          </Box>

          {/* Suggest dropdown */}
          {suggests.length > 0 && (
            <Box sx={{
              mt: 0.5, borderRadius: 2, overflow: 'hidden',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            }}>
              {suggests.map((s, i) => (
                <Box key={i} onClick={() => selectSuggest(s)} sx={{
                  display: 'flex', alignItems: 'flex-start', gap: 1.5,
                  px: 2, py: 1.2, cursor: 'pointer',
                  borderBottom: i < suggests.length - 1 ? `1px solid ${isDark ? '#334155' : '#f1f5f9'}` : 'none',
                  '&:hover': { bgcolor: isDark ? '#0f172a' : '#f8fafc' },
                }}>
                  <MapPin size={13} color="#6366f1" weight="fill" style={{ flexShrink: 0, marginTop: 2 }} />
                  <Typography fontSize={12} color={isDark ? '#e2e8f0' : '#1e293b'} sx={{ lineHeight: 1.4 }}>{s}</Typography>
                </Box>
              ))}
            </Box>
          )}

          {searchError && (
            <Typography fontSize={11} color="#ef4444" mt={0.5} pl={0.5}>{searchError}</Typography>
          )}
        </Box>

        {/* Map */}
        <Box sx={{
          position: 'relative', height: 380,
          borderTop: suggests.length > 0 ? `1px solid ${isDark ? '#334155' : '#e2e8f0'}` : 'none',
        }}>
          {loading && (
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 10,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5,
              bgcolor: isDark ? '#0f172a' : '#f8fafc',
            }}>
              <CircularProgress size={32} sx={{ color: '#6366f1' }} />
              <Typography fontSize={13} color={isDark ? '#94a3b8' : '#64748b'}>Xarita yuklanmoqda...</Typography>
            </Box>
          )}
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Geolokatsiya tugmasi — xarita ichida */}
          <button
            onClick={handleLocate}
            disabled={locating}
            title="Mening joylashuvim"
            style={{
              position: 'absolute', bottom: 16, right: 16, zIndex: 999,
              width: 40, height: 40, borderRadius: 8,
              border: '2px solid rgba(255,255,255,0.9)',
              cursor: locating ? 'not-allowed' : 'pointer',
              background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.25)'; }}
          >
            {locating
              ? <CircularProgress size={16} sx={{ color: '#6366f1' }} />
              : <NavigationArrow size={20} color="#6366f1" weight="fill" />}
          </button>
        </Box>

        {/* Footer */}
        <Box sx={{
          px: 2.5, py: 1.5,
          borderTop: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          bgcolor: isDark ? '#0f172a' : '#f8fafc',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
            <MapPin size={15} color={selectedAddress ? '#6366f1' : (isDark ? '#475569' : '#94a3b8')}
              weight="fill" style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography fontSize={12}
              color={selectedAddress ? (isDark ? '#e2e8f0' : '#1e293b') : (isDark ? '#475569' : '#94a3b8')}
              sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
              {selectedAddress || 'Xaritada nuqta bosing yoki yuqoridan qidiring'}
            </Typography>
          </Box>
          <button
            onClick={() => { if (selectedAddress) { onSelect(selectedAddress); onClose(); } }}
            disabled={!selectedAddress}
            style={{
              flexShrink: 0, padding: '9px 20px', borderRadius: 10, border: 'none',
              cursor: selectedAddress ? 'pointer' : 'not-allowed',
              background: selectedAddress ? 'linear-gradient(135deg, #6366f1, #818cf8)' : (isDark ? '#1e293b' : '#e2e8f0'),
              color: selectedAddress ? 'white' : (isDark ? '#475569' : '#94a3b8'),
              fontWeight: 700, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <CheckCircle size={15} weight="fill" />
            Tasdiqlash
          </button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
