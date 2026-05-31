import React, { useState, useRef, KeyboardEvent } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMutation, useReactiveVar } from '@apollo/client';
import { CREATE_JOB } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';

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

const STEP_LABELS = ["Asosiy ma'lumot", 'Talablar', "Ko'rib chiqish"];

function Stepper({ current, onGoTo }: StepperProps) {
  return (
    <div className="flex items-center justify-between mb-12 relative px-4">
      {/* background line */}
      <div className="absolute top-5 left-0 w-full h-[2px] bg-[#dae2fd] -z-10" />

      {STEP_LABELS.map((label, idx) => {
        const step = idx + 1;
        const done    = step < current;
        const active  = step === current;
        return (
          <button
            key={step}
            type="button"
            onClick={() => done && onGoTo(step)}
            className="flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                done
                  ? 'bg-[#712ae2] text-white'
                  : active
                  ? 'bg-[#3525cd] text-white ring-4 ring-[#3525cd]/20'
                  : 'bg-[#dae2fd] text-[#464555]',
              ].join(' ')}
            >
              {done ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : step}
            </div>
            <span
              className={[
                'text-xs font-semibold whitespace-nowrap',
                active ? 'text-[#3525cd]' : done ? 'text-[#712ae2]' : 'text-[#464555]',
              ].join(' ')}
            >
              {label}
            </span>
          </button>
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
}

function SkillTagInput({ skills, onAdd, onRemove }: SkillTagInputProps) {
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
      className="flex flex-wrap gap-2 p-3 border border-[#c7c4d8] rounded-xl min-h-[56px] items-center cursor-text focus-within:ring-4 focus-within:ring-[#3525cd]/10 focus-within:border-[#3525cd] transition-all"
      onClick={() => inputRef.current?.focus()}
    >
      {skills.map(s => (
        <span
          key={s}
          className="inline-flex items-center gap-1 px-3 py-1 bg-[#e2dfff] text-[#0f0069] rounded-full text-xs font-semibold"
        >
          {s}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(s); }}
            className="hover:text-red-500 transition-colors leading-none"
            aria-label={`${s} ni o'chirish`}
          >
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
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CreateJobPage = () => {
  const router = useRouter();
  const user   = useReactiveVar(userVar);
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

  const [experienceLevel, setExp]         = useState('');
  const [jobType,         setJobType]     = useState('PERMANENT');
  const [workFormat,      setWorkFormat]  = useState('REMOTE');
  const [deadline,        setDeadline]    = useState('');
  const [requiredSkills,  setSkills]      = useState<string[]>([]);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    if (step === 1) {
      if (!title.trim())    { setError("Ish sarlavhasi kiritilishi shart.");   return false; }
      if (!category)        { setError("Kategoriya tanlanishi shart.");         return false; }
      if (!description.trim()) { setError("Tavsif kiritilishi shart.");        return false; }
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
            title,
            description,
            category,
            propertyType: 'OTHER',
            budget: budgetFrom ? Number(budgetFrom) : 100,
            experienceLevel: experienceLevel || undefined,
            jobType,
            workFormat: workFormat ? [workFormat] : undefined,
            location:  undefined,
            salaryFrom: budgetFrom ? Number(budgetFrom) : undefined,
            salaryTo:   budgetTo   ? Number(budgetTo)   : undefined,
            requiredSkills: requiredSkills.length ? requiredSkills : undefined,
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

      <div className="min-h-screen bg-[#faf8ff]">
        <div className="pt-8 pb-24 px-4 md:px-12 max-w-4xl mx-auto">

          {/* Page Title */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#131b2e] mb-2 tracking-tight">
              Yangi ish e'lon qilish
            </h1>
            <p className="text-[#464555] text-base">
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
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-10 shadow-sm">
            <form onSubmit={e => e.preventDefault()}>

              {/* ══════════════════════════════════════════════════════════════
                  STEP 1 — Asosiy ma'lumot
              ══════════════════════════════════════════════════════════════ */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-[#131b2e] mb-1">Asosiy ma'lumot</h2>
                    <p className="text-sm text-[#464555]">Ish haqida asosiy ma'lumotlarni kiriting</p>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-[#131b2e] mb-2">
                      Ish sarlavhasi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Masalan: Senior React Developer kerak"
                      className="w-full h-14 px-4 rounded-xl border border-[#c7c4d8] focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] transition-all outline-none text-base"
                    />
                    <p className="mt-2 text-xs text-[#464555]">Sarlavha aniq va jozibali bo'lishi kerak.</p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-[#131b2e] mb-2">
                      Kategoriya <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value as JobCategory)}
                        className="w-full h-14 px-4 pr-10 rounded-xl border border-[#c7c4d8] focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] transition-all outline-none appearance-none bg-white text-base"
                      >
                        <option value="">Kategoriyani tanlang</option>
                        {Object.values(JobCategory).map(cat => (
                          <option key={cat} value={cat}>{JOB_CATEGORY_LABELS[cat]}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#464555] pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-[#131b2e] mb-2">
                      Tavsif <span className="text-red-500">*</span>
                    </label>
                    <div className="border border-[#c7c4d8] rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-[#3525cd]/10 focus-within:border-[#3525cd] transition-all">
                      <div className="bg-[#f2f3ff] px-4 py-2 border-b border-[#c7c4d8] flex gap-3">
                        <span className="text-xs text-[#464555] font-medium">Formatlash:</span>
                        {[
                          { icon: 'B', title: 'Qalin' },
                          { icon: 'I', title: 'Kursiv' },
                          { icon: '≡', title: 'Ro\'yxat' },
                        ].map(btn => (
                          <button
                            key={btn.icon}
                            type="button"
                            title={btn.title}
                            className="w-7 h-7 flex items-center justify-center rounded text-[#464555] hover:text-[#3525cd] hover:bg-white transition-all text-sm font-bold"
                          >
                            {btn.icon}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Ish haqida batafsil ma'lumot bering: vazifalar, talablar, natijalar..."
                        rows={7}
                        className="w-full p-4 outline-none resize-none bg-transparent text-base leading-relaxed"
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <p className="text-xs text-[#464555]">Batafsil tavsif ko'proq yuqori malakali frilanserlarni jalb qiladi.</p>
                      <span className="text-xs text-[#777587]">{description.length} belgi</span>
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-semibold text-[#131b2e] mb-3">
                      Budjet ($)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555] font-medium">$</span>
                        <input
                          type="number"
                          value={budgetFrom}
                          onChange={e => setBudgetFrom(e.target.value)}
                          min={0}
                          placeholder="Dan"
                          className="w-full h-14 pl-8 pr-4 rounded-xl border border-[#c7c4d8] focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] outline-none transition-all"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#464555] font-medium">$</span>
                        <input
                          type="number"
                          value={budgetTo}
                          onChange={e => setBudgetTo(e.target.value)}
                          min={0}
                          placeholder="Gacha"
                          className="w-full h-14 pl-8 pr-4 rounded-xl border border-[#c7c4d8] focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] outline-none transition-all"
                        />
                      </div>
                    </div>
                    {(budgetFrom || budgetTo) && (
                      <p className="mt-2 text-sm text-[#3525cd] font-semibold">
                        Belgilangan budjet: {budgetDisplay}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  STEP 2 — Talablar
              ══════════════════════════════════════════════════════════════ */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-xl font-bold text-[#131b2e] mb-1">Talablar</h2>
                    <p className="text-sm text-[#464555]">Loyihangiz uchun kerakli shartlar va mutaxassis mahoratini belgilang</p>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#3525cd]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <h3 className="text-base font-semibold text-[#131b2e]">Tajriba darajasi</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {EXP_LEVELS.map(lvl => (
                        <button
                          key={lvl.value}
                          type="button"
                          onClick={() => setExp(lvl.value)}
                          className={[
                            'p-4 rounded-xl border-2 text-left transition-all',
                            experienceLevel === lvl.value
                              ? 'border-[#3525cd] bg-[#f2f3ff] ring-4 ring-[#3525cd]/10'
                              : 'border-[#c7c4d8] hover:border-[#3525cd]',
                          ].join(' ')}
                        >
                          <span className="block text-sm font-semibold text-[#131b2e]">{lvl.label}</span>
                          <span className="text-xs text-[#464555]">{lvl.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Job Type & Work Format */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#3525cd]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-base font-semibold text-[#131b2e]">Ish turi</h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {JOB_TYPES.map(t => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setJobType(t.value)}
                            className={[
                              'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
                              jobType === t.value
                                ? 'border-[#3525cd] bg-[#3525cd] text-white'
                                : 'border-[#c7c4d8] text-[#464555] hover:border-[#3525cd]',
                            ].join(' ')}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#3525cd]">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h3 className="text-base font-semibold text-[#131b2e]">Ish formati</h3>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {WORK_FORMATS.map(f => (
                          <button
                            key={f.value}
                            type="button"
                            onClick={() => setWorkFormat(f.value)}
                            className={[
                              'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
                              workFormat === f.value
                                ? 'border-[#3525cd] bg-[#3525cd] text-white'
                                : 'border-[#c7c4d8] text-[#464555] hover:border-[#3525cd]',
                            ].join(' ')}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Deadline */}
                  <div>
                    <label className="block text-sm font-semibold text-[#131b2e] mb-2">Muddat (ixtiyoriy)</label>
                    <div className="relative max-w-xs">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#464555] pointer-events-none">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <input
                        type="date"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#c7c4d8] focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-[#3525cd]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" />
                      </svg>
                      <h3 className="text-base font-semibold text-[#131b2e]">Kerakli ko'nikmalar</h3>
                    </div>
                    <SkillTagInput
                      skills={requiredSkills}
                      onAdd={s => setSkills(p => [...p, s])}
                      onRemove={s => setSkills(p => p.filter(x => x !== s))}
                    />
                    <p className="mt-2 text-xs text-[#464555]">
                      Har bir ko'nikmani yozib Enter bosing. Masalan: React, TypeScript, Figma
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
                      <h2 className="text-xl font-bold text-[#131b2e] mb-1">Ko'rib chiqish</h2>
                      <p className="text-sm text-[#464555]">E'lon joylashtirishdan oldin ma'lumotlarni tekshiring</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex items-center gap-1 text-[#3525cd] text-sm font-semibold hover:underline"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Tahrirlash
                    </button>
                  </div>

                  {/* Preview card */}
                  <div className="bg-[#f2f3ff] rounded-2xl p-6 border border-[#3525cd]/10">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                      <div>
                        <h3 className="text-xl font-bold text-[#131b2e] leading-tight">
                          {title || '—'}
                        </h3>
                        <p className="text-[#3525cd] text-sm font-semibold mt-1">
                          {categoryLabel} • {WORK_FORMATS.find(f => f.value === workFormat)?.label ?? '—'}
                        </p>
                      </div>
                      {(budgetFrom || budgetTo) && (
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-[#E2E8F0] flex-shrink-0">
                          <span className="block text-xs text-[#464555]">Budjet</span>
                          <span className="text-sm font-bold text-[#3525cd]">{budgetDisplay}</span>
                        </div>
                      )}
                    </div>

                    {/* Description preview */}
                    {description && (
                      <div className="mb-5">
                        <h4 className="text-sm font-semibold text-[#131b2e] mb-1">Tavsif</h4>
                        <p className="text-sm text-[#464555] leading-relaxed line-clamp-4 whitespace-pre-line">
                          {description}
                        </p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-6 pt-4 border-t border-[#c7c4d8]/50">
                      <div>
                        <span className="block text-xs text-[#464555] mb-0.5">Tajriba</span>
                        <span className="text-sm font-semibold text-[#131b2e]">
                          {experienceLevel ? expLabel : 'Ko\'rsatilmagan'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#464555] mb-0.5">Ish turi</span>
                        <span className="text-sm font-semibold text-[#131b2e]">{jobTypeLabel}</span>
                      </div>
                      {deadline && (
                        <div>
                          <span className="block text-xs text-[#464555] mb-0.5">Muddat</span>
                          <span className="text-sm font-semibold text-[#131b2e]">
                            {new Date(deadline).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {requiredSkills.length > 0 && (
                      <div className="pt-4 mt-4 border-t border-[#c7c4d8]/50">
                        <h4 className="text-sm font-semibold text-[#131b2e] mb-2">Ko'nikmalar</h4>
                        <div className="flex flex-wrap gap-2">
                          {requiredSkills.map(s => (
                            <span key={s} className="px-3 py-1 bg-white border border-[#c7c4d8] rounded-full text-xs font-medium text-[#464555]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      E'lon moderatsiyadan o'tgandan so'ng <strong>24 soat ichida</strong> joylashtiriladi. BuFu foydalanish shartlariga mos bo'lmagan e'lonlar rad etilishi mumkin.
                    </p>
                  </div>

                  {/* Terms checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        className="w-5 h-5 rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]/20 cursor-pointer"
                      />
                    </div>
                    <span className="text-sm text-[#464555] leading-relaxed select-none">
                      Men kiritilgan barcha ma'lumotlar to'g'riligini va BuFu platformasining{' '}
                      <a href="#" className="text-[#3525cd] font-semibold hover:underline">Foydalanish shartlari</a>
                      {' '}hamda{' '}
                      <a href="#" className="text-[#3525cd] font-semibold hover:underline">Maxfiylik siyosati</a>
                      ga roziligimni tasdiqlayman.
                    </span>
                  </label>
                </div>
              )}

              {/* ── Navigation buttons ──────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#E2E8F0]">
                {/* Back / Cancel */}
                {step === 1 ? (
                  <button
                    type="button"
                    onClick={() => router.push('/my-works')}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#464555] hover:bg-[#f2f3ff] transition-all"
                  >
                    Bekor qilish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-[#464555] hover:bg-[#f2f3ff] transition-all"
                  >
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
              <div key={tip.title} className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3">{tip.icon}</div>
                <h4 className="text-sm font-semibold text-[#131b2e] mb-1">{tip.title}</h4>
                <p className="text-xs text-[#464555] leading-relaxed">{tip.text}</p>
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
