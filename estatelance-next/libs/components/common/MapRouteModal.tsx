import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, Box, Typography, IconButton, CircularProgress } from '@mui/material';
import { X, MapPin, NavigationArrow, ArrowRight } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';

interface Props {
  open: boolean;
  onClose: () => void;
  destinationAddress: string;
  destinationName?: string;
  userAvatar?: string;
  destAvatar?: string;
}

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'uz' } }
    );
    const data = await res.json();
    if (!data.length) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch { return null; }
}

// Haversine formula — straight-line distance in km
function haversine(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
    Math.cos((b[0] * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// OSRM road distance
async function roadDistance(a: [number, number], b: [number, number]): Promise<{ km: number; route: [number, number][] } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok') return null;
    const dist = data.routes[0].distance / 1000;
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
      ([lon, lat]: [number, number]) => [lat, lon]
    );
    return { km: dist, route: coords };
  } catch { return null; }
}

export default function MapRouteModal({ open, onClose, destinationAddress, destinationName, userAvatar, destAvatar }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const [status, setStatus] = useState<'idle' | 'locating' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [roadKm, setRoadKm] = useState<number | null>(null);
  const [straightKm, setStraightKm] = useState<number | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setRoadKm(null);
    setStraightKm(null);
    setUserCoords(null);
    setDestCoords(null);
    setErrorMsg('');

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const user: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(user);
        setStatus('loading');

        const dest = await geocode(destinationAddress);
        if (!dest) { setErrorMsg("Manzil topilmadi."); setStatus('error'); return; }
        setDestCoords(dest);

        const straight = haversine(user, dest);
        setStraightKm(straight);

        // Load map
        await import('leaflet').then(async (mod) => {
          const L = mod.default ?? mod;
          if (!containerRef.current) return;
          if (mapRef.current) { try { mapRef.current.remove(); } catch { /**/ } mapRef.current = null; }

          const bounds = L.latLngBounds([user, dest]);
          const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          map.fitBounds(bounds, { padding: [40, 40] });
          mapRef.current = map;

          // Markers — avatar yoki fallback harf
          const makeAvatarIcon = (avatar: string | undefined, fallback: string, borderColor: string, anchorBottom = false) => {
            const inner = avatar
              ? `<img src="${avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
              : `<span style="font-size:14px;font-weight:800;color:white;">${fallback}</span>`;
            return L.divIcon({
              className: '',
              html: `<div style="
                width:36px;height:36px;border-radius:50%;
                background:${avatar ? '#fff' : (anchorBottom ? 'linear-gradient(135deg,#6366f1,#818cf8)' : 'linear-gradient(135deg,#22c55e,#16a34a)')};
                border:3px solid ${borderColor};
                display:flex;align-items:center;justify-content:center;overflow:hidden;
                box-shadow:0 2px 12px rgba(0,0,0,0.25);
              ">${inner}</div>`,
              iconSize: [36, 36],
              iconAnchor: [18, anchorBottom ? 36 : 18],
            });
          };

          const iconA = makeAvatarIcon(userAvatar, 'S', '#22c55e', false);
          const iconB = makeAvatarIcon(destAvatar, 'B', '#6366f1', true);

          L.marker(user, { icon: iconA }).bindPopup('Sizning joylashuvingiz').addTo(map);
          L.marker(dest, { icon: iconB }).bindPopup(destinationName || destinationAddress).addTo(map);

          // Try road route, fallback to straight line
          const road = await roadDistance(user, dest);
          if (road) {
            setRoadKm(road.km);
            L.polyline(road.route, {
              color: '#6366f1', weight: 4, opacity: 0.85,
              dashArray: undefined,
            }).addTo(map);
          } else {
            // Dashed straight line
            L.polyline([user, dest], {
              color: '#6366f1', weight: 3, opacity: 0.7, dashArray: '8 6',
            }).addTo(map);
          }

          setTimeout(() => { mapRef.current?.invalidateSize(); }, 100);
          setStatus('done');
        });
      },
      (err) => {
        if (err.code === 1) setErrorMsg("Joylashuvga ruxsat berilmadi. Brauzer sozlamalarini tekshiring.");
        else setErrorMsg("Joylashuv aniqlanmadi. Qayta urinib ko'ring.");
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    return () => {
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /**/ } mapRef.current = null; }
    };
  }, [open]);

  const displayKm = roadKm ?? straightKm;
  const isRoad = roadKm !== null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2.5, py: 1.8,
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <NavigationArrow size={17} color="white" weight="fill" />
          <Typography fontWeight={700} fontSize={14} color="white">Manzilgacha masofa</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>
          <X size={18} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Distance info bar */}
        {(status === 'loading' || status === 'done') && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5,
            bgcolor: isDark ? '#0f172a' : '#f8fafc',
            borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
          }}>
            {/* A — user avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                border: '2px solid #22c55e', overflow: 'hidden',
                bgcolor: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {userAvatar
                  ? <img src={userAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Typography fontSize={12} fontWeight={800} color="white">S</Typography>}
              </Box>
              <Typography fontSize={12} color={isDark ? '#94a3b8' : '#64748b'}>Sizning joyingiz</Typography>
            </Box>

            <ArrowRight size={14} color={isDark ? '#475569' : '#94a3b8'} style={{ flexShrink: 0 }} />

            {/* B — dest avatar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                border: '2px solid #6366f1', overflow: 'hidden',
                bgcolor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {destAvatar
                  ? <img src={destAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Typography fontSize={12} fontWeight={800} color="white">{(destinationName || 'B')[0].toUpperCase()}</Typography>}
              </Box>
              <Typography fontSize={12} color={isDark ? '#94a3b8' : '#64748b'} noWrap>
                {(destinationName || destinationAddress).split(',')[0]}
              </Typography>
            </Box>

            {/* Distance */}
            {displayKm !== null ? (
              <Box sx={{ flexShrink: 0, textAlign: 'right' }}>
                <Typography fontSize={20} fontWeight={800} color="#6366f1" lineHeight={1}>
                  {displayKm < 1
                    ? `${Math.round(displayKm * 1000)} m`
                    : `${displayKm.toFixed(1)} km`}
                </Typography>
                <Typography fontSize={10} color={isDark ? '#475569' : '#94a3b8'}>
                  {isRoad ? 'yo\'l masofasi' : 'to\'g\'ri chiziq'}
                </Typography>
              </Box>
            ) : (
              <CircularProgress size={18} sx={{ color: '#6366f1', flexShrink: 0 }} />
            )}
          </Box>
        )}

        {/* Status overlays */}
        {(status === 'idle' || status === 'locating') && (
          <Box sx={{ height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
            <CircularProgress size={36} sx={{ color: '#6366f1' }} />
            <Typography fontSize={13} color={isDark ? '#94a3b8' : '#64748b'}>
              {status === 'locating' ? 'Joylashuvingiz aniqlanmoqda...' : ''}
            </Typography>
          </Box>
        )}

        {status === 'error' && (
          <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, px: 3, bgcolor: isDark ? '#0f172a' : '#f8fafc' }}>
            <MapPin size={36} color="#ef4444" weight="fill" />
            <Typography fontSize={13} color="#ef4444" textAlign="center">{errorMsg}</Typography>
          </Box>
        )}

        {/* Map */}
        {(status === 'loading' || status === 'done') && (
          <Box sx={{ position: 'relative', height: 360 }}>
            {status === 'loading' && (
              <Box sx={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(248,250,252,0.6)' }}>
                <CircularProgress size={30} sx={{ color: '#6366f1' }} />
              </Box>
            )}
            <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
