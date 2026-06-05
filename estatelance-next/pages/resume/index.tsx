import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useReactiveVar } from '@apollo/client';
import { GET_MY_PROFILE } from '../../apollo/user/query';
import { GENERATE_RESUME } from '../../apollo/user/mutation';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';
import { userVar } from '../../apollo/store';
import { JobCategory, JOB_CATEGORY_LABELS } from '../../libs/enums';

// ── Konstantalar ────────────────────────────────────────────────────────────
const TOP_LANGUAGES = ["O'zbek", 'Rus', 'Ingliz', 'Turk', 'Arab', 'Xitoy (Mandarin)', 'Koreys', 'Nemis', 'Fransuz', 'Ispan'];
const LANG_LEVELS = ["Boshlang'ich", "O'rta", 'Yaxshi', 'Erkin', 'Ona tili'];
const EDU_LEVELS = ['Kollej', 'Bakalavr', 'Magistr', 'PHD'];
const STORAGE_KEY = 'bufu_resume_form_v1';

// ── Tiplar ────────────────────────────────────────────────────────────────────
interface ExpRow { role: string; company: string; period: string; description: string }
interface EduRow { level: string; field: string; institution: string; status: 'studying' | 'graduated'; year: string }
interface LangRow { name: string; custom: string; level: string }
interface ResumeData {
  fullName: string; headline: string; profileImage?: string; location?: string; email?: string; phone?: string;
  summary: string; skills: string[]; highlights: string[];
  experience: { role: string; company?: string; period?: string; bullets: string[] }[];
  education: { degree: string; institution?: string; period?: string }[];
  languages: string[]; githubUrl?: string; linkedinUrl?: string; behanceUrl?: string;
}

const emptyExp = (): ExpRow => ({ role: '', company: '', period: '', description: '' });
const emptyEdu = (): EduRow => ({ level: 'Bakalavr', field: '', institution: '', status: 'studying', year: '' });
const emptyLang = (): LangRow => ({ name: TOP_LANGUAGES[0], custom: '', level: LANG_LEVELS[1] });

interface FormState {
  fullName: string; targetRole: string; category: string; customCategory: string;
  phone: string; email: string; yearsExperience: string; extraNotes: string;
  lang: 'uz' | 'ru' | 'en'; tone: 'professional' | 'creative' | 'concise';
  imageOn: boolean; imageUrl: string;
  experiences: ExpRow[]; education: EduRow[]; languages: LangRow[];
}

const defaultForm = (): FormState => ({
  fullName: '', targetRole: '', category: '', customCategory: '',
  phone: '', email: '', yearsExperience: '', extraNotes: '',
  lang: 'uz', tone: 'professional', imageOn: false, imageUrl: '',
  experiences: [emptyExp()], education: [emptyEdu()], languages: [emptyLang()],
});

function ResumePage() {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  const { data: profileData } = useQuery(GET_MY_PROFILE, { fetchPolicy: 'cache-and-network' });
  const profile = profileData?.getMyProfile;

  const [f, setF] = useState<FormState>(defaultForm());
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const loaded = useRef(false);

  // ── localStorage'dan tiklash ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) setF({ ...defaultForm(), ...parsed.form });
        if (parsed.resume) setResume(parsed.resume);
      }
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);

  // ── localStorage'ga saqlash (har o'zgarishda) ───────────────────────────────
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: f, resume })); } catch { /* ignore */ }
  }, [f, resume]);

  // ── Profildan boshlang'ich to'ldirish (faqat bo'sh maydonlarga) ─────────────
  useEffect(() => {
    if (!profile || !loaded.current) return;
    setF((prev) => ({
      ...prev,
      fullName: prev.fullName || profile.fullName || profile.username || '',
      phone: prev.phone || profile.phoneNumber || '',
      email: prev.email || profile.email || '',
      category: prev.category || (profile.freelancerCategory ? String(profile.freelancerCategory) : ''),
      imageUrl: prev.imageUrl || profile.profileImage || '',
    }));
  }, [profile]);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => setF((p) => ({ ...p, [key]: val }));
  const prefillSkills: string[] = useMemo(() => (Array.isArray(profile?.skills) ? profile.skills : []), [profile]);

  // ── Rasm yuklash ────────────────────────────────────────────────────────────
  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      const SIZE = 300;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, SIZE, SIZE);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      URL.revokeObjectURL(objectUrl);
      try {
        const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64: dataUrl, fileName: file.name }) });
        const data = await res.json();
        set('imageUrl', data.url || dataUrl);
      } catch { set('imageUrl', dataUrl); }
    };
    img.src = objectUrl;
  };

  // ── Validatsiya (majburiy maydonlar) ────────────────────────────────────────
  const validate = (): string[] => {
    const errs: string[] = [];
    if (!f.fullName.trim()) errs.push('To\'liq ismni kiriting.');
    const cat = f.category === 'OTHER_CUSTOM' ? f.customCategory.trim() : f.category.trim();
    if (!cat) errs.push('Sohani tanlang yoki kiriting.');
    if (!f.targetRole.trim()) errs.push('Mo\'ljallangan lavozimni kiriting.');
    const validLangs = f.languages.filter((l) => (l.name === 'BOSHQA' ? l.custom.trim() : l.name.trim()));
    if (validLangs.length === 0) errs.push('Kamida bitta til qo\'shing.');
    const validEdu = f.education.filter((e) => e.level && e.field.trim() && e.year.trim());
    if (validEdu.length === 0) errs.push('Kamida bitta ta\'lim (daraja + soha + yil) to\'ldiring.');
    return errs;
  };

  const [generateResume, { loading, error }] = useMutation(GENERATE_RESUME);

  const handleGenerate = async () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }

    const category = f.category === 'OTHER_CUSTOM' ? f.customCategory.trim() : (JOB_CATEGORY_LABELS as any)[f.category] || f.category;
    const cleanExp = f.experiences.filter((e) => e.role.trim() || e.company.trim() || e.description.trim())
      .map((e) => ({ role: e.role || undefined, company: e.company || undefined, period: e.period || undefined, description: e.description || undefined }));
    const cleanEdu = f.education.filter((e) => e.level && e.field.trim())
      .map((e) => ({ level: e.level, field: e.field, institution: e.institution || undefined, status: e.status, year: e.year || undefined }));
    const cleanLang = f.languages.map((l) => ({ name: l.name === 'BOSHQA' ? l.custom.trim() : l.name, level: l.level }))
      .filter((l) => l.name);

    try {
      const { data } = await generateResume({
        variables: {
          input: {
            fullName: f.fullName || undefined,
            targetRole: f.targetRole || undefined,
            category: category || undefined,
            profileImage: f.imageOn && f.imageUrl ? f.imageUrl : undefined,
            phone: f.phone || undefined,
            email: f.email || undefined,
            yearsExperience: f.yearsExperience ? parseInt(f.yearsExperience) : undefined,
            experiences: cleanExp.length ? cleanExp : undefined,
            education: cleanEdu,
            languages: cleanLang,
            extraNotes: f.extraNotes || undefined,
            language: f.lang,
            tone: f.tone,
          },
        },
      });
      if (data?.generateResume) {
        setResume(data.generateResume as ResumeData);
        setTimeout(() => document.getElementById('resume-result')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch { /* error UI orqali */ }
  };

  if (!user?._id) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <p className="text-slate-500">Resume yaratish uchun avval tizimga kiring.</p>
        <button onClick={() => router.push('/account')} className="btn-primary" style={{ marginTop: 16 }}>Kirish</button>
      </div>
    );
  }

  return (
    <>
      <Head><title>AI Resume yaratish — BuFu</title></Head>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #resume-print, #resume-print * { visibility: visible !important; }
          #resume-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
        @media (max-width: 900px){ .resume-grid{ grid-template-columns: 1fr !important; } }
      `}</style>

      <div className="container" style={{ padding: '32px 24px 80px' }}>
        <div className="no-print" style={{ marginBottom: 24 }}>
          <h1 className="section-title">AI Resume yaratish</h1>
          <p className="section-subtitle">Ma'lumotlarni to'ldiring — AI professional rezyume tayyorlaydi. Ma'lumotlar avtomatik saqlanadi.</p>
        </div>

        {/* Validatsiya xatolari */}
        {errors.length > 0 && (
          <div className="no-print" style={{ marginBottom: 18, padding: '14px 18px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <strong style={{ color: '#dc2626', fontSize: 14 }}>Quyidagilarni to'ldiring:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: '#dc2626', fontSize: 13 }}>
              {errors.map((er, i) => <li key={i}>{er}</li>)}
            </ul>
          </div>
        )}

        <div className="resume-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.1fr)', gap: 24, alignItems: 'start' }}>
          {/* ── CHAP: FORMA ── */}
          <div className="card-base no-print" style={{ padding: 24 }}>

            {/* Asosiy */}
            <SectionTitle>Asosiy ma'lumotlar</SectionTitle>
            <div style={grid2}>
              <Field label="To'liq ism *"><input className="input-base" value={f.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Otabek Ikromov" /></Field>
              <Field label="Mo'ljallangan lavozim *"><input className="input-base" value={f.targetRole} onChange={(e) => set('targetRole', e.target.value)} placeholder="UI/UX Designer" /></Field>
            </div>
            <div style={grid2}>
              <Field label="Telefon"><input className="input-base" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+998 90 123 45 67" /></Field>
              <Field label="Email"><input className="input-base" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="siz@email.com" /></Field>
            </div>

            {/* Soha */}
            <Field label="Soha *">
              <select className="input-base" value={f.category} onChange={(e) => set('category', e.target.value)}>
                <option value="">— Sohani tanlang —</option>
                {Object.values(JobCategory).map((c) => (
                  <option key={c} value={c}>{(JOB_CATEGORY_LABELS as any)[c]}</option>
                ))}
                <option value="OTHER_CUSTOM">Boshqa (qo'lda kiritish)</option>
              </select>
              {f.category === 'OTHER_CUSTOM' && (
                <input className="input-base" style={{ marginTop: 8 }} value={f.customCategory} onChange={(e) => set('customCategory', e.target.value)} placeholder="Sohangizni yozing" />
              )}
            </Field>

            <Field label="Umumiy tajriba (yil)"><input className="input-base" type="number" min={0} value={f.yearsExperience} onChange={(e) => set('yearsExperience', e.target.value)} placeholder="3" /></Field>

            {/* Rasm on/off */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '6px 0 16px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Rasm qo'shasizmi?</div>
                <div className="text-slate-500" style={{ fontSize: 12 }}>Rezyumega profil rasmingiz qo'shiladi</div>
              </div>
              <Toggle on={f.imageOn} onClick={() => set('imageOn', !f.imageOn)} />
            </div>
            {f.imageOn && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {f.imageUrl ? <img src={f.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 22 }}>🖼️</span>}
                </div>
                <label className="btn-outline" style={{ cursor: 'pointer' }}>
                  {f.imageUrl ? 'Rasmni almashtirish' : 'Rasm yuklash'}
                  <input type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
                </label>
              </div>
            )}

            {/* Skills prefill */}
            {prefillSkills.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Profil ko'nikmalari (avtomatik ishlatiladi)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {prefillSkills.map((s) => <span key={s} className="badge badge-active">{s}</span>)}
                </div>
              </div>
            )}

            {/* Tillar */}
            <SectionTitle>Tillar *</SectionTitle>
            {f.languages.map((row, i) => (
              <RowBox key={i} onRemove={f.languages.length > 1 ? () => set('languages', f.languages.filter((_, idx) => idx !== i)) : undefined}>
                <div style={grid2}>
                  <select className="input-base" value={row.name} onChange={(e) => updateAt(setF, 'languages', i, 'name', e.target.value)}>
                    {TOP_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                    <option value="BOSHQA">Boshqa…</option>
                  </select>
                  <select className="input-base" value={row.level} onChange={(e) => updateAt(setF, 'languages', i, 'level', e.target.value)}>
                    {LANG_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                {row.name === 'BOSHQA' && (
                  <input className="input-base" style={{ marginTop: 8 }} value={row.custom} onChange={(e) => updateAt(setF, 'languages', i, 'custom', e.target.value)} placeholder="Til nomini yozing" />
                )}
              </RowBox>
            ))}
            <AddBtn onClick={() => set('languages', [...f.languages, emptyLang()])}>+ Til qo'shish</AddBtn>

            {/* Ta'lim */}
            <SectionTitle>Ta'lim *</SectionTitle>
            {f.education.map((row, i) => (
              <RowBox key={i} onRemove={f.education.length > 1 ? () => set('education', f.education.filter((_, idx) => idx !== i)) : undefined}>
                <div style={grid2}>
                  <select className="input-base" value={row.level} onChange={(e) => updateAt(setF, 'education', i, 'level', e.target.value)}>
                    {EDU_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <input className="input-base" placeholder="Yo'nalish / soha *" value={row.field} onChange={(e) => updateAt(setF, 'education', i, 'field', e.target.value)} />
                </div>
                <input className="input-base" style={{ marginTop: 8 }} placeholder="O'quv yurti" value={row.institution} onChange={(e) => updateAt(setF, 'education', i, 'institution', e.target.value)} />
                <div style={{ ...grid2, marginTop: 8 }}>
                  <select className="input-base" value={row.status} onChange={(e) => updateAt(setF, 'education', i, 'status', e.target.value)}>
                    <option value="studying">Hozir o'qiyapman</option>
                    <option value="graduated">Tugatganman</option>
                  </select>
                  <input className="input-base" placeholder={row.status === 'studying' ? 'Tugatish yili *' : 'Tugatgan yil *'} value={row.year} onChange={(e) => updateAt(setF, 'education', i, 'year', e.target.value)} />
                </div>
              </RowBox>
            ))}
            <AddBtn onClick={() => set('education', [...f.education, emptyEdu()])}>+ Ta'lim qo'shish</AddBtn>

            {/* Ish tajribasi */}
            <SectionTitle>Ish tajribasi</SectionTitle>
            {f.experiences.map((row, i) => (
              <RowBox key={i} onRemove={f.experiences.length > 1 ? () => set('experiences', f.experiences.filter((_, idx) => idx !== i)) : undefined}>
                <div style={grid2}>
                  <input className="input-base" placeholder="Lavozim" value={row.role} onChange={(e) => updateAt(setF, 'experiences', i, 'role', e.target.value)} />
                  <input className="input-base" placeholder="Kompaniya / mustaqil" value={row.company} onChange={(e) => updateAt(setF, 'experiences', i, 'company', e.target.value)} />
                </div>
                <input className="input-base" style={{ marginTop: 8 }} placeholder="Davr (2023 – hozir)" value={row.period} onChange={(e) => updateAt(setF, 'experiences', i, 'period', e.target.value)} />
                <textarea className="input-base" style={{ marginTop: 8, minHeight: 60 }} placeholder="Nima qildingiz, qanday natija?" value={row.description} onChange={(e) => updateAt(setF, 'experiences', i, 'description', e.target.value)} />
              </RowBox>
            ))}
            <AddBtn onClick={() => set('experiences', [...f.experiences, emptyExp()])}>+ Tajriba qo'shish</AddBtn>

            <Field label="Qo'shimcha eslatma (AI hisobga oladi)">
              <textarea className="input-base" style={{ minHeight: 60 }} value={f.extraNotes} onChange={(e) => set('extraNotes', e.target.value)} placeholder="Masalan: SaaS startaplar uchun ish izlayapman" />
            </Field>

            <div style={grid2}>
              <Field label="Til">
                <select className="input-base" value={f.lang} onChange={(e) => set('lang', e.target.value as any)}>
                  <option value="uz">O'zbekcha</option><option value="ru">Ruscha</option><option value="en">Inglizcha</option>
                </select>
              </Field>
              <Field label="Ohang">
                <select className="input-base" value={f.tone} onChange={(e) => set('tone', e.target.value as any)}>
                  <option value="professional">Professional</option><option value="creative">Ijodiy</option><option value="concise">Qisqa</option>
                </select>
              </Field>
            </div>

            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', color: '#dc2626', fontSize: 13 }}>{error.message}</div>
            )}

            <button onClick={handleGenerate} disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 18, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Yaratilmoqda…' : '✨ Resume yaratish'}
            </button>
            <button onClick={() => { localStorage.removeItem(STORAGE_KEY); setF(defaultForm()); setResume(null); setErrors([]); }} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              Formani tozalash
            </button>
          </div>

          {/* ── O'NG: NATIJA ── */}
          <div id="resume-result">
            {!resume ? (
              <div className="card-flat no-print" style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                Resume shu yerda paydo bo'ladi
              </div>
            ) : (
              <>
                <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 12 }}>
                  <button onClick={() => window.print()} className="btn-outline">⬇ PDF yuklab olish</button>
                  <button onClick={handleGenerate} className="btn-ghost" disabled={loading}>↻ Qayta</button>
                </div>
                <ResumeView resume={resume} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Resume ko'rinishi ──────────────────────────────────────────────────────────
function ResumeView({ resume: r }: { resume: ResumeData }) {
  return (
    <div id="resume-print" className="card-flat" style={{ padding: 36, background: 'var(--surface)' }}>
      <header style={{ display: 'flex', gap: 18, alignItems: 'center', borderBottom: '2px solid var(--primary)', paddingBottom: 16, marginBottom: 20 }}>
        {r.profileImage && (
          <img src={r.profileImage} alt="" style={{ width: 84, height: 84, borderRadius: 14, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }} />
        )}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>{r.fullName}</h1>
          <p style={{ fontSize: 16, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>{r.headline}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8, fontSize: 13, color: 'var(--text-3)' }}>
            {r.location && <span>📍 {r.location}</span>}
            {r.email && <span>✉ {r.email}</span>}
            {r.phone && <span>☎ {r.phone}</span>}
            {r.linkedinUrl && <span>in: {r.linkedinUrl}</span>}
            {r.githubUrl && <span>git: {r.githubUrl}</span>}
            {r.behanceUrl && <span>be: {r.behanceUrl}</span>}
          </div>
        </div>
      </header>

      {r.summary && <Section title="Profil"><p style={{ color: 'var(--text-2)', lineHeight: 1.7 }}>{r.summary}</p></Section>}
      {r.highlights?.length > 0 && (
        <Section title="Asosiy yutuqlar"><ul style={{ paddingLeft: 18, color: 'var(--text-2)', lineHeight: 1.7 }}>{r.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul></Section>
      )}
      {r.skills?.length > 0 && (
        <Section title="Ko'nikmalar"><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{r.skills.map((s) => <span key={s} className="badge badge-active">{s}</span>)}</div></Section>
      )}
      {r.experience?.length > 0 && (
        <Section title="Ish tajribasi">
          {r.experience.map((e, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--text-1)' }}>{e.role}{e.company ? ` · ${e.company}` : ''}</strong>
                {e.period && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.period}</span>}
              </div>
              {e.bullets?.length > 0 && <ul style={{ paddingLeft: 18, marginTop: 4, color: 'var(--text-2)', lineHeight: 1.6 }}>{e.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
            </div>
          ))}
        </Section>
      )}
      {r.education?.length > 0 && (
        <Section title="Ta'lim">
          {r.education.map((e, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ color: 'var(--text-1)' }}><strong>{e.degree}</strong>{e.institution ? ` — ${e.institution}` : ''}</span>
              {e.period && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{e.period}</span>}
            </div>
          ))}
        </Section>
      )}
      {r.languages?.length > 0 && (
        <Section title="Tillar"><span style={{ color: 'var(--text-2)' }}>{r.languages.join(' · ')}</span></Section>
      )}
    </div>
  );
}

// ── Yordamchi UI ────────────────────────────────────────────────────────────────
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
const lbl: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'var(--text-3)', display: 'block' };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={{ ...lbl, marginBottom: 6 }}>{label}</label>{children}</div>;
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', margin: '20px 0 10px' }}>{children}</h3>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ marginBottom: 18 }}><h3 style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary)', marginBottom: 8 }}>{title}</h3>{children}</section>;
}
function RowBox({ children, onRemove }: { children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12, marginBottom: 8, position: 'relative' }}>
      {onRemove && <button onClick={onRemove} className="btn-ghost" style={{ position: 'absolute', top: 6, right: 6, padding: '2px 8px', fontSize: 12 }}>✕</button>}
      {children}
    </div>
  );
}
function AddBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button onClick={onClick} className="btn-outline" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: '8px 16px', marginBottom: 6 }}>{children}</button>;
}
function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ width: 46, height: 26, borderRadius: 999, background: on ? 'var(--primary)' : 'var(--border)', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}
function updateAt<K extends keyof FormState>(setter: React.Dispatch<React.SetStateAction<FormState>>, listKey: K, i: number, field: string, value: string) {
  setter((p) => {
    const list = [...(p[listKey] as any[])];
    list[i] = { ...list[i], [field]: value };
    return { ...p, [listKey]: list };
  });
}

export default withLayoutBasic(ResumePage);
