import React, { useState, useMemo } from 'react';
import { useTheme } from '../../hooks/useThemeContext';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal,
  KeyboardAvoidingView, Platform, Image, Linking, Clipboard,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { GET_JOB_BY_ID, GET_BIDS_FOR_JOB, GET_USER_BY_ID, GET_JOBS } from '../../apollo/queries';
import { CREATE_BID, ACCEPT_BID } from '../../apollo/mutations';
import { Colors } from '../../constants/colors';
import { safeImageUri } from '../../libs/safeImage';
import { useAuth } from '../../hooks/useAuth';
import { Bid, Job } from '../../types';
import JobCard from '../../components/JobCard';

const EXP_LABELS: Record<string, string> = {
  JUNIOR: 'Junior (1-2 yil)',
  MIDDLE: 'Middle (3-5 yil)',
  SENIOR: 'Senior (5+ yil)',
  NO_EXP: 'Tajribasiz',
  ANY:    'Istalgan daraja',
};
const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME:  'To\'liq stavka',
  PART_TIME:  'Qisman stavka',
  CONTRACT:   'Shartnoma',
  FREELANCE:  'Frilanser',
  INTERNSHIP: 'Amaliyot',
};
const FORMAT_LABELS: Record<string, string> = {
  REMOTE:  'Masofaviy',
  ONSITE:  'Ofisda',
  HYBRID:  'Gibrid',
};
const QUESTIONS = [
  'Ish joyi qayerda?',
  'Ish grafigi qanday?',
  'Vakansiya ochiqmi?',
  'Qanday bog\'lanish mumkin?',
  'Maosh qanday?',
  'Boshqa savol',
];

function buildRouteHtml(
  destAddress: string,
  userLat?: number,
  userLon?: number,
): string {
  const encoded = JSON.stringify(destAddress);
  const hasUser = userLat != null && userLon != null && userLat !== 0 && userLon !== 0;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:calc(100% - 72px); }
    #info { position:fixed; bottom:0; left:0; right:0; height:72px; background:#fff;
            display:flex; align-items:center; gap:16px; padding:0 16px;
            border-top:1px solid #e2e8f0; font-family:sans-serif; z-index:1000; }
    .stat { text-align:center; }
    .stat-val { font-size:17px; font-weight:700; color:#0f172a; }
    .stat-lbl { font-size:11px; color:#94a3b8; margin-top:2px; }
    .divider { width:1px; height:32px; background:#e2e8f0; }
    #loading { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
               background:#fff; padding:14px 22px; border-radius:14px;
               font-family:sans-serif; font-size:14px; color:#4f46e5;
               z-index:2000; box-shadow:0 4px 16px rgba(0,0,0,0.12); }
    .leaflet-bottom.leaflet-right { bottom:80px !important; }
    .leaflet-control-zoom { border-radius:12px !important; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.15) !important; }
    .leaflet-control-zoom a { width:36px !important; height:36px !important; line-height:36px !important; font-size:18px !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="loading">Manzil aniqlanmoqda...</div>
  <div id="info" style="display:none">
    <div class="stat"><div class="stat-val" id="dist">—</div><div class="stat-lbl">Masofa</div></div>
    <div class="divider"></div>
    <div class="stat"><div class="stat-val" id="car">—</div><div class="stat-lbl">Mashina</div></div>
    <div class="divider"></div>
    <div class="stat"><div class="stat-val" id="walk">—</div><div class="stat-lbl">Piyoda</div></div>
  </div>
  <script>
    var map = L.map('map', { attributionControl: false, zoomControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    function makeIcon(color) {
      return L.divIcon({
        html: '<div style="background:'+color+';width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
        iconSize:[16,16], iconAnchor:[8,8], className:''
      });
    }

    function drawRoute(uLat, uLon, dLat, dLon) {
      L.marker([uLat, uLon], { icon: makeIcon('#22c55e') }).addTo(map)
        .bindPopup('Siz').openPopup();
      L.marker([dLat, dLon], { icon: makeIcon('#4f46e5') }).addTo(map)
        .bindPopup('Ish joyi');

      // OSRM orqali yo'l hisoblash
      var url = 'https://router.project-osrm.org/route/v1/driving/'
        + uLon+','+uLat+';'+dLon+','+dLat
        + '?overview=full&geometries=geojson';

      fetch(url)
        .then(function(r){ return r.json(); })
        .then(function(data) {
          document.getElementById('loading').style.display = 'none';
          document.getElementById('info').style.display = 'flex';

          var route = data.routes[0];
          var km = (route.distance / 1000).toFixed(1);
          var carMin = Math.ceil(route.duration / 60);
          var walkMin = Math.ceil(route.distance / 80); // ~80m/min

          document.getElementById('dist').textContent  = km + ' km';
          document.getElementById('car').textContent   = carMin < 60 ? carMin+" daq" : Math.floor(carMin/60)+"s "+carMin%60+"d";
          document.getElementById('walk').textContent  = walkMin < 60 ? walkMin+" daq" : Math.floor(walkMin/60)+"s "+walkMin%60+"d";

          // Yo'l chizig'i
          var coords = route.geometry.coordinates.map(function(c){ return [c[1],c[0]]; });
          L.polyline(coords, { color:'#4f46e5', weight:4, opacity:0.85 }).addTo(map);
          map.fitBounds(L.polyline(coords).getBounds(), { padding:[24,24] });
        })
        .catch(function(){
          document.getElementById('loading').textContent = 'Yo\\'l topilmadi';
        });
    }

    var dest = ${encoded};
    var hasUser = ${hasUser ? 'true' : 'false'};
    var uLat = ${userLat ?? 0};
    var uLon = ${userLon ?? 0};

    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(dest))
      .then(function(r){ return r.json(); })
      .then(function(data) {
        var dLat = data[0] ? parseFloat(data[0].lat) : 41.2995;
        var dLon = data[0] ? parseFloat(data[0].lon) : 69.2401;
        if (hasUser) {
          drawRoute(uLat, uLon, dLat, dLon);
        } else {
          document.getElementById('loading').style.display = 'none';
          map.setView([dLat, dLon], 14);
          L.marker([dLat, dLon], { icon: makeIcon('#4f46e5') }).addTo(map).bindPopup('Ish joyi').openPopup();
        }
      })
      .catch(function(){
        document.getElementById('loading').textContent = 'Xato yuz berdi';
      });
  </script>
</body>
</html>`;
}

function buildMapHtml(address: string): string {
  const encoded = JSON.stringify(address);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body, #map { width:100%; height:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    var addr = ${encoded};
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(addr) + '&limit=1', {
      headers: { 'Accept-Language': 'uz,ru,en' }
    })
    .then(r => r.json())
    .then(data => {
      if (data && data[0]) {
        var lat = parseFloat(data[0].lat);
        var lon = parseFloat(data[0].lon);
        map.setView([lat, lon], 15);
        var icon = L.divIcon({
          html: '<div style="background:#4f46e5;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
          iconSize:[32,32], iconAnchor:[16,32], className:''
        });
        L.marker([lat, lon], { icon: icon }).addTo(map);
      } else {
        map.setView([41.2995, 69.2401], 12);
      }
    })
    .catch(() => map.setView([41.2995, 69.2401], 12));
  </script>
</body>
</html>`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const months = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export default function JobDetailScreen() {
  const { themeKey } = useTheme();
  const s = useMemo(() => StyleSheet.create({
    safe:       { flex: 1, backgroundColor: Colors.bg },
    center:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
    header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    headerTitle:{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.text },
    body:       { padding: 20 },
    salary:     { fontSize: 22, fontWeight: '900', color: Colors.text, marginBottom: 6 },
    salaryNone: { fontSize: 18, fontWeight: '700', color: Colors.textSub, marginBottom: 6 },
    quickInfo:  { fontSize: 14, color: Colors.textSub, lineHeight: 22, marginBottom: 4 },
    formatText: { fontSize: 14, color: Colors.textSub, marginBottom: 16 },
    mapCard:      { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, marginBottom: 16, backgroundColor: Colors.white },
    mapWebView:   { height: 180 },
    mapInfo:      { padding: 14 },
    mapAddrRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    mapLabel:     { fontSize: 12, color: Colors.textMuted, marginBottom: 3 },
    mapAddress:   { fontSize: 14, color: Colors.text, fontWeight: '600' },
    mapRouteRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
    mapRouteText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    routeHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 10, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: Colors.border },
    routeTitle:   { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text, textAlign: 'center' },
    recSection:   { marginTop: 8 },
    recTitle:     { fontSize: 18, fontWeight: '900', color: Colors.text, marginBottom: 4 },
    recSub:       { fontSize: 13, color: Colors.textMuted, marginBottom: 14 },
    statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 12 },
    statCard:   { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#bbf7d0' },
    statVal:    { fontSize: 16, fontWeight: '800', color: Colors.text },
    statLbl:    { fontSize: 12, color: Colors.textSub, marginTop: 2 },
    dateText:   { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
    companyCard:{ flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    companyLabel:{ fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 },
    companyName:{ fontSize: 16, fontWeight: '800', color: Colors.text, flexShrink: 1 },
    companyLogo:{ width: 52, height: 52, borderRadius: 26 },
    companyLogoFallback:{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    companyLogoText:{ fontSize: 20, fontWeight: '900', color: Colors.primary },
    section:    { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    sectionTitle:{ fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
    desc:       { fontSize: 15, color: Colors.textSub, lineHeight: 24 },
    skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    skillChip:  { backgroundColor: Colors.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
    skillText:  { fontSize: 13, color: Colors.textSub },
    contactCard:          { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
    contactTop:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    contactAvatar:        { width: 52, height: 52, borderRadius: 26 },
    contactAvatarFallback:{ width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
    contactAvatarText:    { fontSize: 20, fontWeight: '900', color: Colors.primary },
    contactName:          { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    contactRole:          { fontSize: 13, color: Colors.textMuted },
    contactBtn: { backgroundColor: Colors.primary + '15', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    contactBtnText:{ color: Colors.primary, fontWeight: '700', fontSize: 15 },
    questionsSection:{ marginBottom: 16 },
    questionsTitle:  { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 4 },
    questionsSub:    { fontSize: 13, color: Colors.textMuted, marginBottom: 12 },
    questionBtn:     { backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
    questionText:    { fontSize: 15, color: Colors.text },
    reportBtn:  { alignItems: 'center', paddingVertical: 16, marginBottom: 16 },
    reportText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
    bidCard:    { backgroundColor: Colors.bg, borderRadius: 12, padding: 14, marginBottom: 10 },
    bidTop:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    bidName:    { fontSize: 14, fontWeight: '700', color: Colors.text },
    bidAmount:  { fontSize: 15, fontWeight: '900', color: Colors.green },
    bidCover:   { fontSize: 13, color: Colors.textSub, lineHeight: 18 },
    acceptBtn:  { marginTop: 10, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 9, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    acceptBtnText:{ color: 'white', fontWeight: '700', fontSize: 14 },
    acceptedBadge:{ marginTop: 8, backgroundColor: '#dcfce7', borderRadius: 10, paddingVertical: 7, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5 },
    acceptedText: { color: Colors.green, fontWeight: '700', fontSize: 13 },
    footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
    applyBtn:   { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    applyBtnText:{ color: 'white', fontWeight: '800', fontSize: 16 },
    backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet:      { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    sheetHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
    sheetSub:   { fontSize: 13, color: Colors.textSub, marginTop: 2 },
    closeBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
    coverInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 14, fontSize: 15, color: Colors.text, backgroundColor: Colors.bg, height: 140, marginBottom: 16 },
  }), [themeKey]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [saved, setSaved]             = useState(false);
  const [bidModal, setBidModal]       = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [routeModal, setRouteModal]   = useState(false);
  const [userCoords, setUserCoords]   = useState<{ lat: number; lon: number } | null>(null);
  const [locLoading, setLocLoading]   = useState(false);

  const { data: jobData, loading: jobLoading } = useQuery(GET_JOB_BY_ID, { variables: { jobId: id } });
  const { data: bidsData, refetch: refetchBids } = useQuery(GET_BIDS_FOR_JOB, {
    variables: { jobId: id }, skip: !user,
  });
  const [fetchAgent, { data: agentData }] = useLazyQuery(GET_USER_BY_ID);

  const [createBid, { loading: submitting }] = useMutation(CREATE_BID);
  const [acceptBid] = useMutation(ACCEPT_BID);

  const job   = jobData?.getJobById;
  const bids: Bid[] = bidsData?.getBidsForJob ?? [];
  const isOwner      = job?.agentId === user?._id;
  const isFreelancer = user?.userType === 'FREELANCER';
  const myBid        = bids.find(b => b.freelancerId === user?._id);

  // Similar jobs (same category)
  const { data: similarData } = useQuery(GET_JOBS, {
    skip: !job?.category,
    variables: { input: { page: 1, limit: 6, category: job?.category } },
  });
  const similarJobs: Job[] = (similarData?.getJobs ?? []).filter((j: Job) => j._id !== id);

  React.useEffect(() => {
    if (job?.agentId) fetchAgent({ variables: { userId: job.agentId } });
  }, [job?.agentId]);

  const openInMaps = async (address: string, fromLat?: number, fromLon?: number) => {
    const q = encodeURIComponent(address);

    // ── Android: geo: URI → tizim o'zi barcha xarita ilovalarni ko'rsatadi ──
    if (Platform.OS === 'android') {
      const geoUrl = fromLat
        ? `geo:${fromLat},${fromLon}?q=${q}`
        : `geo:0,0?q=${q}`;
      Linking.openURL(geoUrl).catch(() =>
        Linking.openURL(`https://maps.google.com/?q=${q}`)
      );
      return;
    }

    // ── iOS: o'rnatilgan ilovalar + yo'q bo'lsa App Store ──
    const iosApps = [
      {
        label: 'Apple Maps',
        scheme: 'maps://',
        getUrl: () => fromLat
          ? `maps://?saddr=${fromLat},${fromLon}&daddr=${q}`
          : `maps://?q=${q}`,
        storeUrl: null,
      },
      {
        label: 'Google Maps',
        scheme: 'comgooglemaps://',
        getUrl: () => fromLat
          ? `comgooglemaps://?saddr=${fromLat},${fromLon}&daddr=${q}&directionsmode=driving`
          : `comgooglemaps://?q=${q}`,
        storeUrl: 'https://apps.apple.com/app/google-maps/id585027354',
      },
      {
        label: 'Yandex Maps',
        scheme: 'yandexmaps://',
        getUrl: () => fromLat
          ? `yandexmaps://maps.yandex.ru/?rtext=${fromLat},${fromLon}~${q}&rtt=auto`
          : `yandexmaps://maps.yandex.ru/?text=${q}`,
        storeUrl: 'https://apps.apple.com/app/yandex-maps/id313877526',
      },
      {
        label: '2GIS',
        scheme: 'dgis://',
        getUrl: () => fromLat
          ? `dgis://2gis.ru/routeSearch/to/${q}/from/${fromLat},${fromLon}`
          : `dgis://2gis.ru/search/${q}`,
        storeUrl: 'https://apps.apple.com/app/2gis/id481627348',
      },
    ];

    const checked = await Promise.all(
      iosApps.map(async app => ({
        ...app,
        installed: await Linking.canOpenURL(app.scheme).catch(() => false),
      }))
    );

    const options: any[] = checked.map(app => ({
      text: app.installed ? app.label : `${app.label}  (O'rnatish)`,
      onPress: () => {
        if (app.installed) {
          Linking.openURL(app.getUrl());
        } else if (app.storeUrl) {
          Linking.openURL(app.storeUrl);
        }
      },
    }));

    options.push({ text: 'Bekor', style: 'cancel', onPress: () => {} });
    Alert.alert('Xaritada ochish', address, options);
  };

  const agent = agentData?.getUserById;

  const handleBid = async (letter?: string) => {
    try {
      await createBid({
        variables: { input: { jobId: id, bidAmount: user?.hourlyRate ?? 0, coverLetter: letter ?? '' } },
      });
      setBidModal(false);
      setCoverLetter('');
      refetchBids();
      Alert.alert('Yuborildi!', 'Taklifingiz muvaffaqiyatli yuborildi.');
    } catch (err: any) {
      Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato yuz berdi');
    }
  };

  const sendQuestion = (q: string) => {
    Alert.alert('Savol', `"${q}" — ushbu savol taklif bilan birga yuboriladi.`, [
      { text: 'Bekor' },
      { text: 'Yuborish', onPress: () => handleBid(q) },
    ]);
  };

  const handleAccept = (bidId: string, name?: string) => {
    Alert.alert('Tasdiqlash', `${name ?? 'Freelancer'}ni yollaysizmi?`, [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Ha', onPress: async () => {
        try { await acceptBid({ variables: { bidId } }); refetchBids(); Alert.alert('✅', 'Freelancer yollandi!'); }
        catch (err: any) { Alert.alert('Xato', err?.graphQLErrors?.[0]?.message ?? 'Xato'); }
      }},
    ]);
  };

  if (jobLoading) return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  if (!job)      return <View style={s.center}><Text style={{ color: Colors.textSub }}>Ish topilmadi</Text></View>;

  const viewCount = Math.max(1, (parseInt(job._id.slice(-2), 16) % 8) + 1);
  const hasSalary = job.salaryFrom || job.salaryTo || job.budget;
  const salaryText = job.salaryFrom && job.salaryTo
    ? `$${job.salaryFrom.toLocaleString()} – $${job.salaryTo.toLocaleString()}`
    : job.salaryFrom ? `$${job.salaryFrom.toLocaleString()}+`
    : job.budget     ? `$${job.budget.toLocaleString()}`
    : null;

  const quickInfo = [
    job.jobType         && JOB_TYPE_LABELS[job.jobType],
    job.experienceLevel && EXP_LABELS[job.experienceLevel],
    job.workSchedule,
    job.hoursPerDay     && `${job.hoursPerDay} soat`,
  ].filter(Boolean).join(' • ');

  const workFormat = Array.isArray(job.workFormat)
    ? job.workFormat.map((f: string) => FORMAT_LABELS[f] ?? f).join(', ')
    : null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{job.title}</Text>
        <TouchableOpacity style={s.headerBtn} onPress={() => setSaved(v => !v)}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={22} color={saved ? '#ef4444' : Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerBtn}>
          <Ionicons name="ellipsis-horizontal" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={s.body}>

          {/* Salary */}
          {salaryText ? (
            <Text style={s.salary}>{salaryText}</Text>
          ) : (
            <Text style={s.salaryNone}>Kelishiladi</Text>
          )}

          {/* Quick info */}
          {quickInfo ? <Text style={s.quickInfo}>{quickInfo}</Text> : null}

          {/* Work format */}
          {workFormat ? (
            <Text style={s.formatText}>Ish joyi: {workFormat}</Text>
          ) : null}

          {/* Location map — OpenStreetMap */}
          {job.location ? (
            <View style={s.mapCard}>
              <WebView
                style={s.mapWebView}
                source={{ html: buildMapHtml(job.location) }}
                scrollEnabled={false}
                javaScriptEnabled
                originWhitelist={['*']}
                onShouldStartLoadWithRequest={() => true}
                setSupportMultipleWindows={false}
              />
              <View style={s.mapInfo}>
                <View style={s.mapAddrRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mapLabel}>Ish joyi</Text>
                    <Text style={s.mapAddress}>{job.location}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={() => {
                        Clipboard.setString(job.location ?? '');
                        Alert.alert('Nusxalandi', job.location);
                      }}
                    >
                      <Ionicons name="copy-outline" size={19} color={Colors.textSub} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openInMaps(job.location)}>
                      <Ionicons name="navigate-outline" size={20} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity style={s.mapRouteRow} onPress={async () => {
                    setLocLoading(true);
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync();
                      if (status === 'granted') {
                        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                        setUserCoords({ lat: loc.coords.latitude, lon: loc.coords.longitude });
                      } else {
                        setUserCoords(null);
                      }
                    } catch { setUserCoords(null); }
                    setLocLoading(false);
                    setRouteModal(true);
                  }}>
                  <Ionicons name="navigate-circle-outline" size={17} color={Colors.primary} />
                  <Ionicons name="walk-outline" size={16} color={Colors.primary} />
                  <Ionicons name="car-outline"  size={16} color={Colors.primary} />
                  <Ionicons name="bus-outline"  size={16} color={Colors.primary} />
                  <Text style={s.mapRouteText}>Yo'l hisoblash</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={[s.statCard, { flex: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View>
                  <Text style={s.statVal}>{job.bidCount ?? 0} kishi</Text>
                  <Text style={s.statLbl}>taklif yubordi</Text>
                </View>
                <Ionicons name="people-outline" size={20} color="#22c55e" style={{ marginLeft: 'auto' }} />
              </View>
            </View>
            <View style={[s.statCard, { flex: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View>
                  <Text style={s.statVal}>{viewCount} kishi</Text>
                  <Text style={s.statLbl}>hozir ko'rmoqda</Text>
                </View>
                <Ionicons name="eye-outline" size={20} color="#22c55e" style={{ marginLeft: 'auto' }} />
              </View>
            </View>
          </View>

          {/* Date */}
          {job.createdAt ? (
            <Text style={s.dateText}>Joylashtirilgan {formatDate(job.createdAt)}</Text>
          ) : null}

          {/* Ish beruvchi (poster) card — avatar chapda */}
          <TouchableOpacity
            style={s.companyCard}
            activeOpacity={0.8}
            onPress={() => job.agentId && router.push(`/profile/${job.agentId}` as any)}
          >
            {safeImageUri(agent?.profileImage) ? (
              <Image source={{ uri: safeImageUri(agent?.profileImage) }} style={s.companyLogo} />
            ) : (
              <View style={s.companyLogoFallback}>
                <Text style={s.companyLogoText}>
                  {(agent?.fullName ?? job.agentName ?? '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.companyLabel}>Ish beruvchi</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text style={s.companyName} numberOfLines={1}>
                  {agent?.fullName ?? job.agentName ?? 'Noma\'lum'}
                </Text>
                <Ionicons name="checkmark-circle" size={15} color="#3b82f6" />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Description */}
          <View style={s.section}>
            <Text style={s.desc}>{job.description}</Text>
          </View>

          {/* Required skills */}
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Talab qilinadigan ko'nikmalar</Text>
              <View style={s.skillsWrap}>
                {job.requiredSkills.map((sk: string) => (
                  <View key={sk} style={s.skillChip}>
                    <Text style={s.skillText}>{sk}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Contact person */}
          <View style={s.contactCard}>
            <View style={s.contactTop}>
              {safeImageUri(agent?.profileImage) ? (
                <Image source={{ uri: safeImageUri(agent?.profileImage) }} style={s.contactAvatar} />
              ) : (
                <View style={s.contactAvatarFallback}>
                  <Text style={s.contactAvatarText}>
                    {(agent?.fullName ?? job.agentName ?? '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={s.contactName}>{agent?.fullName ?? job.agentName ?? '—'}</Text>
                <Text style={s.contactRole}>Bog'lanish uchun</Text>
              </View>
            </View>
            <TouchableOpacity
              style={s.contactBtn}
              onPress={() => router.push({
                pathname: `/messages/${job.agentId}` as any,
                params: {
                  name:   encodeURIComponent(agent?.fullName ?? job.agentName ?? ''),
                  avatar: encodeURIComponent(agent?.profileImage ?? ''),
                },
              })}
            >
              <Text style={s.contactBtnText}>Yozish</Text>
            </TouchableOpacity>
          </View>

          {/* Questions section */}
          {isFreelancer && job.status === 'OPEN' && !isOwner && !myBid && (
            <View style={s.questionsSection}>
              <Text style={s.questionsTitle}>Ish beruvchiga savol yuboring</Text>
              <Text style={s.questionsSub}>U taklifingiz bilan birga oladi</Text>
              {QUESTIONS.map(q => (
                <TouchableOpacity key={q} style={s.questionBtn} onPress={() => sendQuestion(q)}>
                  <Text style={s.questionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Report */}
          <TouchableOpacity style={s.reportBtn}>
            <Text style={s.reportText}>Shikoyat qilish</Text>
          </TouchableOpacity>

          {/* Tavsiyalar */}
          {similarJobs.length > 0 && (
            <View style={s.recSection}>
              <Text style={s.recTitle}>Siz uchun Tavsiyalar</Text>
              <Text style={s.recSub}>Shu yo'nalishdagi o'xshash ishlar</Text>
              {similarJobs.slice(0, 5).map(sj => (
                <JobCard
                  key={sj._id}
                  job={sj}
                  onPress={() => router.push(`/jobs/${sj._id}` as any)}
                />
              ))}
            </View>
          )}

          {/* Bids (owner only) */}
          {isOwner && bids.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Takliflar ({bids.length})</Text>
              {bids.map(bid => (
                <View key={bid._id} style={s.bidCard}>
                  <View style={s.bidTop}>
                    <Text style={s.bidName}>{bid.freelancerName}</Text>
                    <Text style={s.bidAmount}>${bid.bidAmount}</Text>
                  </View>
                  {!!bid.coverLetter && <Text style={s.bidCover} numberOfLines={3}>{bid.coverLetter}</Text>}
                  {bid.status === 'PENDING' && job.status === 'OPEN' && (
                    <TouchableOpacity style={s.acceptBtn} onPress={() => handleAccept(bid._id, bid.freelancerName)}>
                      <Ionicons name="checkmark-circle-outline" size={15} color="white" />
                      <Text style={s.acceptBtnText}>Yollash</Text>
                    </TouchableOpacity>
                  )}
                  {bid.status === 'ACCEPTED' && (
                    <View style={s.acceptedBadge}>
                      <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                      <Text style={s.acceptedText}>Yollangan</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom apply button */}
      <View style={s.footer}>
        {myBid ? (
          <View style={[s.applyBtn, { backgroundColor: Colors.green }]}>
            <Ionicons name="checkmark-circle" size={18} color="white" />
            <Text style={s.applyBtnText}>Taklif yuborildi</Text>
          </View>
        ) : isFreelancer && job.status === 'OPEN' && !isOwner ? (
          <TouchableOpacity style={s.applyBtn} onPress={() => setBidModal(true)}>
            <Text style={s.applyBtnText}>Taklif yuborish</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Route Modal */}
      <Modal visible={routeModal} animationType="slide" onRequestClose={() => setRouteModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }} edges={['top']}>
          <View style={s.routeHeader}>
            <TouchableOpacity onPress={() => setRouteModal(false)} style={s.headerBtn}>
              <Ionicons name="chevron-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={s.routeTitle} numberOfLines={1}>Yo'l hisoblash</Text>
            <TouchableOpacity
              style={s.headerBtn}
              onPress={() => openInMaps(job.location ?? '', userCoords?.lat, userCoords?.lon)}
            >
              <Ionicons name="share-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {locLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={{ marginTop: 12, color: Colors.textSub, fontSize: 14 }}>Joylashuv aniqlanmoqda...</Text>
            </View>
          ) : (
            <WebView
              style={{ flex: 1 }}
              source={{ html: buildRouteHtml(job.location ?? '', userCoords?.lat, userCoords?.lon) }}
              javaScriptEnabled
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              onShouldStartLoadWithRequest={() => true}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Bid Modal */}
      <Modal visible={bidModal} transparent animationType="slide" onRequestClose={() => setBidModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setBidModal(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHeader}>
              <View>
                <Text style={s.sheetTitle}>Taklif yuborish</Text>
                <Text style={s.sheetSub} numberOfLines={1}>{job.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setBidModal(false)} style={s.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={s.coverInput}
              placeholder="O'zingiz haqingizda va bu ish uchun nega eng yaxshi tanlov ekanligingizni yozing..."
              placeholderTextColor={Colors.textMuted}
              value={coverLetter}
              onChangeText={setCoverLetter}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              style={[s.applyBtn, submitting && { opacity: 0.7 }]}
              onPress={() => handleBid(coverLetter)}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="white" /> : <Text style={s.applyBtnText}>Yuborish</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

