import React, { useState, useRef, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import { useTheme } from 'next-themes';
import { CREATE_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';
import MapModal, { getYandexSuggests } from '../../libs/components/common/YandexMapModal';

// ─── Inline mini map (faqat ko'rsatish uchun, route yo'q) ─────────────────────
function MiniMapInline({ address, isDark }: { address: string; isDark: boolean }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!address) return;
    let cancelled = false;
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    import('leaflet').then(async mod => {
      const L = mod.default ?? mod;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`, { headers: { 'Accept-Language': 'uz' } });
      const data = await res.json();
      if (cancelled || !data.length || !containerRef.current) { setLoading(false); return; }
      if (mapRef.current) { try { mapRef.current.remove(); } catch { /**/ } mapRef.current = null; }
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      containerRef.current.style.height = '160px';
      const map = L.map(containerRef.current, { center: coords, zoom: 14, zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false, touchZoom: false, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: '', html: `<div style="width:20px;height:20px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#6366f1,#818cf8);border:2.5px solid white;box-shadow:0 2px 8px rgba(99,102,241,0.5);transform:rotate(-45deg)"></div>`, iconSize: [20, 20], iconAnchor: [10, 20] });
      L.marker(coords, { icon }).addTo(map);
      mapRef.current = map;
      setTimeout(() => { if (!cancelled && mapRef.current) mapRef.current.invalidateSize(); setLoading(false); }, 100);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; if (mapRef.current) { try { mapRef.current.remove(); } catch { /**/ } mapRef.current = null; } };
  }, [address]);

  return (
    <div style={{ position: 'relative', height: 160 }}>
      {loading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#16161F' : '#f8fafc' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: 160 }} />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatWithSpaces(raw: string): string {
  if (!raw) return '';
  return Number(raw).toLocaleString('en-US').replace(/,/g, ' ');
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXP_LEVELS = [
  { value: 'NONE',   label: "Boshlang'ich", sub: '0–2 yil tajriba' },
  { value: 'JUNIOR', label: "O'rta",        sub: '2–5 yil tajriba'  },
  { value: 'SENIOR', label: 'Yuqori',       sub: '5+ yil tajriba'  },
];

const JOB_TYPES = [
  { value: 'PERMANENT',  label: 'Bir martalik' },
  { value: 'TEMPORARY',  label: 'Doimiy'       },
];

const WORK_FORMATS = [
  { value: 'REMOTE',  label: 'Masofaviy' },
  { value: 'ONSITE',  label: 'Ofisda'    },
  { value: 'HYBRID',  label: 'Gibrid'    },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

interface StepperProps {
  current: number;
  onGoTo: (step: number) => void;
}

const STEP_LABELS = ["Tavsif", 'Talablar', "Ko'rib chiqish"];

function Stepper({ current, onGoTo }: StepperProps) {
  const total = STEP_LABELS.length;
  // Progress: between step circles, each segment is 1/(total-1) of the line width
  // We render segments between each pair of steps
  return (
    <div className="flex items-center mb-12 px-4">
      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const done   = step < current;
        const active = step === current;
        const isLast = step === total;
        return (
          <React.Fragment key={step}>
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => done && onGoTo(step)}
                className={[
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all focus:outline-none',
                  done
                    ? 'bg-[#3525cd] text-white cursor-pointer'
                    : active
                    ? 'bg-[#3525cd] text-white ring-4 ring-[#3525cd]/20'
                    : 'bg-[#dae2fd] text-[#464555] cursor-default',
                ].join(' ')}
              >
                {done ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : step}
              </button>
              <span
                className={[
                  'text-xs font-semibold whitespace-nowrap',
                  active ? 'text-[#3525cd]' : done ? 'text-[#3525cd]' : 'text-[#464555]',
                ].join(' ')}
              >
                {label}
              </span>
            </div>

            {/* Connector line between steps */}
            {!isLast && (
              <div className="flex-1 h-[2px] mx-2 mb-5 rounded-full overflow-hidden bg-[#dae2fd]">
                {/* filled portion: if next step is done or active, fill full; else empty */}
                <div
                  className="h-full bg-[#3525cd] transition-all duration-300"
                  style={{ width: current > step ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Skill Tag Input ──────────────────────────────────────────────────────────

interface SkillTagInputProps {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
  isDark?: boolean;
}

function SkillTagInput({ skills, onAdd, onRemove, isDark = false }: SkillTagInputProps) {
  const [val, setVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const t = val.trim();
    if (t && !skills.includes(t)) onAdd(t);
    setVal('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
    if (e.key === 'Backspace' && !val && skills.length) {
      onRemove(skills[skills.length - 1]);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[56px] items-center cursor-text transition-all"
      style={{ border: `1px solid ${isDark ? '#27272F' : '#c7c4d8'}`, backgroundColor: isDark ? '#0f172a' : '#ffffff' }}
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map(s => (
        <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff', color: isDark ? '#a5b4fc' : '#3730a3' }}>
          {s}
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(s); }}
            className="hover:text-red-500 transition-colors leading-none" aria-label={`${s} ni o'chirish`}>
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={handleAdd}
        placeholder={skills.length === 0 ? "Skill qo'shing (Enter bosing)..." : ''}
        className="flex-1 outline-none min-w-[140px] bg-transparent text-sm"
        style={{ color: isDark ? '#f1f5f9' : '#131b2e' }}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CreateJobPage = () => {
  const router = useRouter();
  const user   = useReactiveVar(userVar);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Dark mode color tokens
  const pageBg    = isDark ? '#0f172a' : '#faf8ff';
  const cardBg    = isDark ? '#16161F' : '#ffffff';
  const cardBorder = isDark ? '#27272F' : '#E2E8F0';
  const textPrim  = isDark ? '#f1f5f9' : '#131b2e';
  const textSec   = isDark ? '#94a3b8' : '#464555';
  const inputBg   = isDark ? '#0f172a' : '#ffffff';
  const inputBorder = isDark ? '#27272F' : '#c7c4d8';
  const labelClr  = isDark ? '#e2e8f0' : '#131b2e';
  const sectionBg = isDark ? '#0f172a' : '#f2f3ff';
  const sectionBorder = isDark ? '#27272F' : '#c7c4d8';
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [createJob, { loading }] = useMutation(CREATE_JOB);

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [title,           setTitle]       = useState('');
  const [category,        setCategory]    = useState<JobCategory | ''>('');
  const [description,     setDescription] = useState('');
  const [budgetFrom,      setBudgetFrom]  = useState('');
  const [budgetTo,        setBudgetTo]    = useState('');
  const [negotiable,      setNegotiable]  = useState(false);
  const [budgetType,      setBudgetType]  = useState<'fixed' | 'hourly'>('fixed');
  const [budgetAmount,    setBudgetAmount] = useState('');
  const [currency,        setCurrency]    = useState<'UZS' | 'USD' | 'KRW' | 'RUB'>('UZS');
  const [jobLocation,     setJobLocation] = useState('');
  const [mapOpen,         setMapOpen]     = useState(false);
  const [locationSuggests, setLocationSuggests] = useState<string[]>([]);
  const locationTimer = useRef<any>(null);

  const [contactPhone,    setContactPhone] = useState('');
  const [experienceLevel, setExp]         = useState('');
  const [jobType,         setJobType]     = useState('PERMANENT');
  const [workFormat,      setWorkFormat]  = useState('REMOTE');
  const [deadline,        setDeadline]    = useState('');
  const [requiredSkills,  setSkills]      = useState<string[]>([]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      if (!title.trim())           { setError("Ish sarlavhasi kiritilishi shart.");  return false; }
      if (title.trim().length < 5) { setError("Sarlavha kamida 5 belgi bo'lishi kerak."); return false; }
      if (!category)               { setError("Kategoriya tanlanishi shart.");        return false; }
      if (!description.trim())     { setError("Tavsif kiritilishi shart.");           return false; }
      if (description.trim().length < 20) { setError("Tavsif kamida 20 belgi bo'lishi kerak."); return false; }
      if (contactPhone && !/^[\+\d\s\-()]{7,20}$/.test(contactPhone)) {
        setError("Telefon raqam noto'g'ri formatda. Masalan: +998 90 123 45 67");
        return false;
      }
    }
    if (step === 3 && !agreed) {
      setError("Foydalanish shartlariga rozilik kerak.");
      return false;
    }
    setError('');
    return true;
  };

  const goToStep = (s: number) => {
    if (s > step) { if (!validate()) return; }
    setError('');
    setStep(s);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => { if (validate()) goToStep(step + 1); };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category) {
      setError("Nom, tavsif va kategoriya to'ldirilishi shart.");
      return;
    }
    if (!agreed) {
      setError("Foydalanish shartlariga rozilik kerak.");
      return;
    }
    try {
      await createJob({
        variables: {
          input: {
            title:            title.trim(),
            description:      description.trim(),
            category,
            propertyType:     'OTHER',
            budget:           negotiable ? 0 : (budgetFrom ? Number(budgetFrom) : 0),
            experienceLevel:  experienceLevel || undefined,
            jobType:          jobType || undefined,
            workFormat:       workFormat ? [workFormat] : undefined,
            location:         jobLocation.trim() || undefined,
            salaryFrom:       (!negotiable && budgetFrom) ? Number(budgetFrom) : undefined,
            salaryTo:         (!negotiable && budgetTo)   ? Number(budgetTo)   : undefined,
            requiredSkills:   requiredSkills.length ? requiredSkills : undefined,
            contactPhone:     contactPhone.trim() || undefined,
          },
        },
      });
      router.push('/my-works');
    } catch (err: any) {
      setError(err?.graphQLErrors?.[0]?.message ?? 'Xatolik yuz berdi. Qayta urinib ko\'ring.');
    }
  };

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => { if (mounted && !user._id) router.replace('/account'); }, [mounted, user._id]);
  if (!mounted || !user._id) return null;

  // ── Derived display values for review step ──────────────────────────────────
  const expLabel      = EXP_LEVELS.find(e => e.value === experienceLevel)?.label ?? '—';
  const jobTypeLabel  = JOB_TYPES.find(t => t.value === jobType)?.label ?? '—';
  const formatLabel   = WORK_FORMATS.find(f => f.value === workFormat)?.label ?? '—';
  const categoryLabel = category ? JOB_CATEGORY_LABELS[category as JobCategory] : '—';
  const budgetDisplay = budgetFrom || budgetTo
    ? `$${budgetFrom || '?'} – $${budgetTo || '?'}`
    : 'Ko\'rsatilmagan';

  return (
    <>
      <Head><title>Yangi ish e'lon qilish — BuFu</title></Head>

      <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
        <div className="pt-8 pb-24 px-4 md:px-12 max-w-4xl mx-auto">

          {/* Page Title */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight" style={{ color: textPrim }}>
              Yangi ish e&apos;lon qilish
            </h1>
            <p className="text-base" style={{ color: textSec }}>
              Loyihangiz uchun eng yaxshi mutaxassisni toping
            </p>
          </div>

          {/* Stepper */}
          <Stepper current={step} onGoTo={goToStep} />

          {/* Error banner */}
          {error && (
            <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-.75-9.25a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zM10 14.5a.75.75 0 110-1.5.75.75 0 010 1.5z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Form Card */}
          <div className="rounded-2xl p-6 md:p-10 shadow-sm" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
            <form onSubmit={e => e.preventDefault()}>

              {/* ══════════════════════════════════════════════════════════════
                  STEP 1 — Asosiy ma'lumot
              ══════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: textPrim }}>Tavsif</h2>
                    <p className="text-sm" style={{ color: textSec }}>Ish haqida asosiy ma&apos;lumotlarni kiriting</p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      Ish sarlavhasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Masalan: Senior React Developer kerak"
                      className="w-full h-14 px-4 rounded-xl outline-none text-base transition-all"
                      style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrim }}
                    />
                    <p className="mt-2 text-xs" style={{ color: textSec }}>Sarlavha aniq va jozibali bo&apos;lishi kerak.</p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      Kategoriya <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as JobCategory)}
                        className="w-full h-14 px-4 pr-10 rounded-xl outline-none appearance-none text-base transition-all"
                        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrim }}
                      >
                        <option value="">Kategoriyani tanlang</option>
                        {Object.values(JobCategory).map(cat => (
                          <option key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: textSec }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      Tavsif <span className="text-red-500">*</span>
                    </label>
                    <div className="rounded-xl overflow-hidden transition-all" style={{ border: `1px solid ${inputBorder}` }}>
                      <div className="px-4 py-2 flex gap-3" style={{ backgroundColor: sectionBg, borderBottom: `1px solid ${sectionBorder}` }}>
                        <span className="text-xs font-medium" style={{ color: textSec }}>Formatlash:</span>
                        {[{ icon: 'B', title: 'Qalin' }, { icon: 'I', title: 'Kursiv' }, { icon: '≡', title: "Ro'yxat" }].map(btn => (
                          <button key={btn.icon} type="button" title={btn.title}
                            className="w-7 h-7 flex items-center justify-center rounded transition-all text-sm font-bold"
                            style={{ color: textSec }}>
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ish haqida batafsil ma'lumot bering: vazifalar, talablar, natijalar..."
                        rows={7}
                        className="w-full p-4 outline-none resize-none text-base leading-relaxed"
                        style={{ backgroundColor: inputBg, color: textPrim }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs" style={{ color: textSec }}>Batafsil tavsif ko&apos;proq yuqori malakali frilanserlarni jalb qiladi.</p>
                      <span className="text-xs" style={{ color: textSec }}>{description.length} belgi</span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    {/* Section header */}
                    <div className="flex items-center gap-2 mb-4">
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="#3525cd" strokeWidth={2}>
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path strokeLinecap="round" d="M2 10h20" />
                      </svg>
                      <h3 className="text-base font-bold" style={{ color: textPrim }}>Budjet</h3>
                    </div>

                    {/* Type selector */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      {/* Fixed price */}
                      <button
                        type="button"
                        onClick={() => setBudgetType('fixed')}
                        className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: budgetType === 'fixed' ? '#3525cd' : inputBorder,
                          backgroundColor: budgetType === 'fixed' ? (isDark ? 'rgba(53,37,205,0.1)' : '#f0f0ff') : inputBg,
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke={budgetType === 'fixed' ? '#3525cd' : '#94a3b8'} strokeWidth={2} className="w-5 h-5 flex-shrink-0 mt-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h4m-4 5h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: budgetType === 'fixed' ? '#3525cd' : textPrim }}>Belgilangan narx</p>
                          <p className="text-xs mt-0.5" style={{ color: textSec }}>Loyiha uchun umumiy qiymat</p>
                        </div>
                      </button>

                      {/* Hourly */}
                      <button
                        type="button"
                        onClick={() => setBudgetType('hourly')}
                        className="flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all"
                        style={{
                          borderColor: budgetType === 'hourly' ? '#3525cd' : inputBorder,
                          backgroundColor: budgetType === 'hourly' ? (isDark ? 'rgba(53,37,205,0.1)' : '#f0f0ff') : inputBg,
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke={budgetType === 'hourly' ? '#3525cd' : '#94a3b8'} strokeWidth={2} className="w-5 h-5 flex-shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                        </svg>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: budgetType === 'hourly' ? '#3525cd' : textPrim }}>Soatbay</p>
                          <p className="text-xs mt-0.5" style={{ color: textSec }}>Ishlangan soatlar uchun to&apos;lov</p>
                        </div>
                      </button>
                    </div>

                    {/* Amount input */}
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      {budgetType === 'hourly' ? `Soatbay narxi (${currency})` : `Budjet miqdori (${currency})`}
                    </label>

                    {/* Currency selector */}
                    <div className="flex gap-2 mb-3">
                      {(['UZS', 'USD', 'KRW', 'RUB'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                          style={{
                            borderColor: currency === c ? '#3525cd' : inputBorder,
                            backgroundColor: currency === c ? '#3525cd' : 'transparent',
                            color: currency === c ? 'white' : textSec,
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center rounded-xl overflow-hidden transition-all"
                      style={{ border: `1px solid ${inputBorder}`, backgroundColor: inputBg }}>
                      <input
                        type="text"
                        value={budgetAmount}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setBudgetAmount(formatWithSpaces(raw));
                          setBudgetFrom(raw);
                        }}
                        placeholder={budgetType === 'hourly' ? 'Masalan: 50 000' : 'Masalan: 5 000 000'}
                        className="flex-1 h-14 px-4 outline-none text-base bg-transparent font-semibold"
                        style={{ color: textPrim }}
                      />
                      <span className="px-4 text-sm font-bold whitespace-nowrap" style={{ color: '#3525cd', borderLeft: `1px solid ${inputBorder}` }}>
                        {budgetType === 'hourly' ? `${currency}/soat` : currency}
                      </span>
                    </div>

                    {/* Preview badge */}
                    {budgetAmount && (
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl"
                        style={{ backgroundColor: isDark ? 'rgba(53,37,205,0.12)' : '#eef0ff', border: `1px solid ${isDark ? 'rgba(53,37,205,0.3)' : '#c7caff'}` }}>
                        {budgetType === 'hourly' ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#3525cd" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                            <circle cx="12" cy="12" r="10" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="#3525cd" strokeWidth={2} className="w-4 h-4 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h10M9 12h10M9 17h10M5 7h.01M5 12h.01M5 17h.01" />
                          </svg>
                        )}
                        <span className="text-sm font-bold text-[#3525cd]">
                          {budgetType === 'hourly'
                            ? `Soatiga ${budgetAmount} ${currency}`
                            : `${budgetAmount} ${currency}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Job Location */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      Ish joyi manzili
                    </label>
                    <div style={{ position: 'relative' }}>
                      {/* Input */}
                      <div className="flex items-center rounded-xl overflow-hidden transition-all"
                        style={{ border: `1px solid ${inputBorder}`, backgroundColor: inputBg }}>
                        <div className="pl-4 flex-shrink-0">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#6366f1">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                        <input
                          type="text"
                          value={jobLocation}
                          onChange={async e => {
                            const val = e.target.value;
                            setJobLocation(val);
                            if (locationTimer.current) clearTimeout(locationTimer.current);
                            if (val.trim().length < 2) { setLocationSuggests([]); return; }
                            locationTimer.current = setTimeout(async () => {
                              const s = await getYandexSuggests(val);
                              setLocationSuggests(s);
                            }, 350);
                          }}
                          placeholder="Manzil yozing yoki xaritadan tanlang..."
                          className="flex-1 h-14 px-3 outline-none text-base bg-transparent"
                          style={{ color: textPrim }}
                        />
                        {jobLocation && (
                          <button type="button" onClick={() => { setJobLocation(''); setLocationSuggests([]); }}
                            className="px-2 text-gray-400 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                        )}
                        <button type="button" onClick={() => setMapOpen(true)}
                          className="flex items-center gap-1.5 px-4 h-14 text-sm font-semibold transition-all flex-shrink-0"
                          style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', color: '#6366f1', borderLeft: `1px solid ${inputBorder}` }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                            <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                          </svg>
                          Xarita
                        </button>
                      </div>

                      {/* Suggest dropdown */}
                      {locationSuggests.length > 0 && (
                        <div className="absolute w-full z-50 rounded-xl overflow-hidden shadow-xl mt-1"
                          style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                          {locationSuggests.map((s, i) => (
                            <div key={i} onClick={() => { setJobLocation(s); setLocationSuggests([]); }}
                              className="flex items-start gap-2 px-4 py-3 cursor-pointer transition-colors"
                              style={{ borderBottom: i < locationSuggests.length - 1 ? `1px solid ${isDark ? '#27272F' : '#f1f5f9'}` : 'none' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDark ? '#0f172a' : '#f8fafc')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6366f1" style={{ flexShrink: 0, marginTop: 2 }}>
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                              </svg>
                              <span className="text-sm" style={{ color: textPrim }}>{s}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <MapModal
                        open={mapOpen}
                        onClose={() => setMapOpen(false)}
                        onSelect={addr => { setJobLocation(addr); setLocationSuggests([]); }}
                        initialAddress={jobLocation}
                      />
                    </div>

                    {/* Mini map preview */}
                    {jobLocation && (
                      <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${inputBorder}` }}>
                        <MiniMapInline address={jobLocation} isDark={isDark} />
                      </div>
                    )}
                  </div>

                  {/* Contact Phone */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>
                      Aloqa telefon raqami
                    </label>
                    <div className="flex items-center rounded-xl overflow-hidden transition-all"
                      style={{ border: `1px solid ${inputBorder}`, backgroundColor: inputBg }}>
                      <div className="pl-4 flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="+998 90 123 45 67"
                        className="flex-1 h-14 px-3 outline-none text-base bg-transparent"
                        style={{ color: textPrim }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: textSec }}>
                      Bo&apos;sh qoldirilsa profilingizdagi raqam ishlatiladi
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 2 — Talablar
              ══════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: textPrim }}>Talablar</h2>
                    <p className="text-sm" style={{ color: textSec }}>Loyihangiz uchun kerakli shartlar va mutaxassis mahoratini belgilang</p>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="text-base font-semibold" style={{ color: textPrim }}>Tajriba darajasi</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {EXP_LEVELS.map(lvl => (
                        <button key={lvl.value} type="button" onClick={() => setExp(lvl.value)}
                          className="p-4 rounded-xl border-2 text-left transition-all"
                          style={{
                            borderColor: experienceLevel === lvl.value ? '#6366f1' : inputBorder,
                            backgroundColor: experienceLevel === lvl.value ? (isDark ? 'rgba(99,102,241,0.15)' : '#f0f0ff') : inputBg,
                          }}>
                          <span className="block text-sm font-semibold" style={{ color: textPrim }}>{lvl.label}</span>
                          <span className="text-xs" style={{ color: textSec }}>{lvl.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Type & Work Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-base font-semibold" style={{ color: textPrim }}>Ish turi</h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {JOB_TYPES.map(t => (
                          <button key={t.value} type="button" onClick={() => setJobType(t.value)}
                            className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                            style={{
                              borderColor: jobType === t.value ? '#6366f1' : inputBorder,
                              backgroundColor: jobType === t.value ? '#6366f1' : 'transparent',
                              color: jobType === t.value ? 'white' : textSec,
                            }}>
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-base font-semibold" style={{ color: textPrim }}>Ish formati</h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {WORK_FORMATS.map(f => (
                          <button key={f.value} type="button" onClick={() => setWorkFormat(f.value)}
                            className="px-4 py-2 rounded-full text-sm font-semibold border transition-all"
                            style={{
                              borderColor: workFormat === f.value ? '#6366f1' : inputBorder,
                              backgroundColor: workFormat === f.value ? '#6366f1' : 'transparent',
                              color: workFormat === f.value ? 'white' : textSec,
                            }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: labelClr }}>Muddat (ixtiyoriy)</label>
                    <div className="relative max-w-xs">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: textSec }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl outline-none transition-all"
                        style={{ backgroundColor: inputBg, border: `1px solid ${inputBorder}`, color: textPrim }} />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth={2} className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                      </svg>
                      <h3 className="text-base font-semibold" style={{ color: textPrim }}>Kerakli ko&apos;nikmalar</h3>
                    </div>
                    <SkillTagInput
                      skills={requiredSkills}
                      onAdd={s => setSkills(p => [...p, s])}
                      onRemove={s => setSkills(p => p.filter(x => x !== s))}
                      isDark={isDark}
                    />
                    <p className="mt-2 text-xs" style={{ color: textSec }}>
                      Har bir ko&apos;nikmani yozib Enter bosing. Masalan: React, TypeScript, Figma
                    </p>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 3 — Ko'rib chiqish
              ══════════════════════════════════════════════════════════════ */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: textPrim }}>Ko&apos;rib chiqish</h2>
                      <p className="text-sm" style={{ color: textSec }}>E&apos;lon joylashtirishdan oldin ma&apos;lumotlarni tekshiring</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-sm font-semibold hover:underline"
                      style={{ color: '#6366f1' }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Tahrirlash
                    </button>
                  </div>

                  {/* Preview card */}
                  <div className="rounded-2xl p-6" style={{ backgroundColor: sectionBg, border: `1px solid ${isDark ? '#27272F' : 'rgba(99,102,241,0.15)'}` }}>
                    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                      <div>
                        <h3 className="text-xl font-bold leading-tight" style={{ color: textPrim }}>{title || '—'}</h3>
                        <p className="text-sm font-semibold mt-1 text-[#6366f1]">{categoryLabel} • {WORK_FORMATS.find(f => f.value === workFormat)?.label ?? '—'}</p>
                      </div>
                      {budgetAmount && (
                        <div className="px-4 py-2 rounded-xl shadow-sm flex-shrink-0" style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                          <span className="block text-xs" style={{ color: textSec }}>
                            {budgetType === 'hourly' ? 'Soatbay' : 'Budjet'}
                          </span>
                          <span className="text-sm font-bold text-[#6366f1]">
                            {budgetType === 'hourly'
                              ? `Soatiga ${budgetAmount} ${currency}`
                              : `${budgetAmount} ${currency}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {description && (
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold mb-1" style={{ color: textPrim }}>Tavsif</h4>
                        <p className="text-sm leading-relaxed line-clamp-4 whitespace-pre-line" style={{ color: textSec }}>{description}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-6 pt-4" style={{ borderTop: `1px solid ${inputBorder}` }}>
                      <div>
                        <span className="block text-xs mb-0.5" style={{ color: textSec }}>Tajriba</span>
                        <span className="text-sm font-semibold" style={{ color: textPrim }}>{experienceLevel ? expLabel : "Ko'rsatilmagan"}</span>
                      </div>
                      <div>
                        <span className="block text-xs mb-0.5" style={{ color: textSec }}>Ish turi</span>
                        <span className="text-sm font-semibold" style={{ color: textPrim }}>{jobTypeLabel}</span>
                      </div>
                      {deadline && (
                        <div>
                          <span className="block text-xs mb-0.5" style={{ color: textSec }}>Muddat</span>
                          <span className="text-sm font-semibold" style={{ color: textPrim }}>{new Date(deadline).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                      )}
                      {jobLocation && (
                        <div>
                          <span className="block text-xs mb-0.5" style={{ color: textSec }}>Manzil</span>
                          <span className="text-sm font-semibold" style={{ color: textPrim }}>{jobLocation.split(',').slice(0,2).join(',')}</span>
                        </div>
                      )}
                    </div>

                    {requiredSkills.length > 0 && (
                      <div className="pt-4 mt-4" style={{ borderTop: `1px solid ${inputBorder}` }}>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: textPrim }}>Ko&apos;nikmalar</h4>
                        <div className="flex flex-wrap gap-2">
                          {requiredSkills.map(s => (
                            <span key={s} className="px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: cardBg, border: `1px solid ${inputBorder}`, color: textSec }}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}` }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-500">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm leading-relaxed" style={{ color: isDark ? '#93c5fd' : '#1d4ed8' }}>
                      E&apos;lon moderatsiyadan o&apos;tgandan so&apos;ng <strong>24 soat ichida</strong> joylashtiriladi.
                    </p>
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded cursor-pointer"
                        style={{ accentColor: '#6366f1' }}
                      />
                    </div>
                    <span className="text-sm leading-relaxed select-none" style={{ color: textSec }}>
                      Men kiritilgan barcha ma&apos;lumotlar to&apos;g&apos;riligini va BuFu platformasining{' '}
                      <a href="#" className="font-semibold hover:underline text-[#6366f1]">Foydalanish shartlari</a>
                      {' '}hamda{' '}
                      <a href="#" className="font-semibold hover:underline text-[#6366f1]">Maxfiylik siyosati</a>
                      ga roziligimni tasdiqlayman.
                    </span>
                  </label>
                </div>
              )}

              {/* ── Navigation buttons ──────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-10 pt-6" style={{ borderTop: `1px solid ${cardBorder}` }}>
                {step === 1 ? (
                  <button type="button" onClick={() => router.push('/my-works')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: textSec }}>
                    Bekor qilish
                  </button>
                ) : (
                  <button type="button" onClick={back}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ color: textSec }}>

                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Orqaga
                  </button>
                )}

                {/* Next / Submit */}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={next}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#3525cd] text-white text-sm font-semibold shadow-lg shadow-[#3525cd]/20 hover:opacity-90 active:scale-95 transition-all"
                  >
                    Keyingisi
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !agreed}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#712ae2] text-white text-sm font-semibold shadow-lg shadow-[#712ae2]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Joylashtirilmoqda...
                      </>
                    ) : (
                      <>
                        E'lon qilish
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Tips section */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-[#3525cd]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                ),
                title: "Aniq sarlavha tanlang",
                text: "Sarlavha qanchalik aniq bo'lsa, mutaxassislar uni shunchalik tez topishadi.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-[#3525cd]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Budjetni to'g'ri baholang",
                text: "Bozor narxlariga mos budjet ko'proq yuqori malakali frilanserlarni jalb qiladi.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-[#3525cd]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Tezkor moderatsiya",
                text: "Bizning jamoa e'lonlarni tezkor tekshiradi va jonli efirga chiqaradi.",
              },
            ].map(tip => (
              <div key={tip.title} className="p-6 rounded-2xl shadow-sm transition-shadow"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}>
                <div className="mb-3">{tip.icon}</div>
                <h4 className="text-sm font-semibold mb-1" style={{ color: textPrim }}>{tip.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: textSec }}>{tip.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(CreateJobPage);

export const getServerSideProps = async () => ({ props: {} });
