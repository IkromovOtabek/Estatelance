import React, { useEffect, useRef, useState } from 'react';
import MapRouteModal from './MapRouteModal';

interface Props {
  address: string;
  height?: number;
  isDark?: boolean;
  destinationName?: string;
  destAvatar?: string;
  userAvatar?: string;
  hideAddressRow?: boolean;
}

async function geocodeAddress(address: string): Promise<[number, number] | null> {
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

export default function MiniMap({ address, height = 160, isDark = false, destinationName, destAvatar, userAvatar, hideAddressRow = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setFailed(false);

    // Load Leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let cancelled = false;

    import('leaflet').then(async (mod) => {
      const L = mod.default ?? mod;
      if (cancelled) return;

      const coords = await geocodeAddress(address);
      if (cancelled || !coords || !containerRef.current) {
        setFailed(true);
        setLoading(false);
        return;
      }

      // Destroy old map
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* */ }
        mapRef.current = null;
      }

      // Fix: ensure container has size before init
      containerRef.current.style.height = `${height}px`;

      const map = L.map(containerRef.current, {
        center: coords,
        zoom: 14,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px;height:22px;
          border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,#6366f1,#818cf8);
          border:2.5px solid white;
          box-shadow:0 2px 10px rgba(99,102,241,0.6);
          transform:rotate(-45deg);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      L.marker(coords, { icon }).addTo(map);
      mapRef.current = map;

      // Critical: invalidate size after mount
      setTimeout(() => {
        if (!cancelled && mapRef.current) {
          mapRef.current.invalidateSize();
        }
        setLoading(false);
      }, 100);
    }).catch(() => {
      setFailed(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        try { mapRef.current.remove(); } catch { /* */ }
        mapRef.current = null;
      }
    };
  }, [address]);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (failed) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* Address row with copy button */}
      {!hideAddressRow && <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 8, marginBottom: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flex: 1, minWidth: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#6366f1" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span style={{
            fontSize: 12, lineHeight: 1.5,
            color: isDark ? '#e2e8f0' : '#16161F',
            fontWeight: 500,
            wordBreak: 'break-word',
          }}>
            {address.split(',').slice(0, 4).join(', ')}
          </span>
        </div>
        <button
          onClick={handleCopy}
          title="Nusxa olish"
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: copied
              ? (isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7')
              : (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)'),
            color: copied ? '#16a34a' : '#6366f1',
            fontSize: 11, fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          )}
        </button>
      </div>}

      {/* Map container — bosilganda route modal ochiladi */}
      <div
        onClick={() => setRouteOpen(true)}
        style={{
          position: 'relative', borderRadius: 12, overflow: 'hidden',
          border: `1px solid ${isDark ? '#27272F' : '#e2e8f0'}`,
          cursor: 'pointer',
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? '#16161F' : '#f8fafc',
            borderRadius: 12,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '3px solid #e2e8f0', borderTopColor: '#6366f1',
              animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        <div ref={containerRef} style={{ width: '100%', height, pointerEvents: 'none' }} />

      </div>

      <MapRouteModal
        open={routeOpen}
        onClose={() => setRouteOpen(false)}
        destinationAddress={address}
        destinationName={destinationName}
        destAvatar={destAvatar}
        userAvatar={userAvatar}
      />
    </div>
  );
}
