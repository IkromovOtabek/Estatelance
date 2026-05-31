import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMutation } from '@apollo/client';
import {
  Briefcase, User, ArrowRight, ArrowLeft, CheckCircle,
  Phone, Buildings, TrendUp, Sparkle, X, MagnifyingGlass
} from '@phosphor-icons/react';
import { SIGNUP } from '../../apollo/user/mutation';

type Role = 'CLIENT' | 'FREELANCER' | '';
type Experience = 'JUNIOR' | 'MIDDLE' | 'SENIOR' | '';
type Step = 1 | 2 | 3;

const INDUSTRIES = ['IT & Texnologiya', 'Marketing', 'Dizayn', 'Moliya', "Ta'lim", 'Boshqa'];
const POPULAR_SKILLS = ['JavaScript', 'React', 'Node.js', 'Python', 'Figma', 'UI/UX', 'Grafik Dizayn',
  'SMM', 'Copywriting', 'Video Montaj', 'Flutter', 'TypeScript', 'Web Development'];

const RegisterPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [role, setRole] = useState<Role>('');

  // Step 2 — common
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+998 ');

  // Step 2 — freelancer
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState<Experience>('');

  // Step 2 — client
  const [company, setCompany] = useState('');
  const [industry, setIndustry] = useState('');

  // Step 3
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [bio, setBio] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [signUp] = useMutation(SIGNUP);

  const toggleSkill = (s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const addCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      const s = skillInput.trim();
      if (!skills.includes(s)) setSkills(prev => [...prev, s]);
      setSkillInput('');
    }
  };

  const handleNext = () => {
    if (step === 1 && !role) return;
    if (step === 2) {
      if (!fullName.trim()) { setError("Ism-familiya kiriting"); return; }
    }
    setError('');
    setStep(prev => (prev + 1) as Step);
  };

  const handleSubmit = async () => {
    if (!agreed) return;
    setLoading(true);
    try {
      // In real app: call signUp mutation with collected data
      // await signUp({ variables: { input: { fullName, phone, memberType: role, ... } } });
      await new Promise(r => setTimeout(r, 1200));
      router.push('/account?registered=1');
    } catch (err: any) {
      setError(err.message ?? "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';

  return (
    <>
      <Head>
        <title>Ro'yxatdan o'tish — BuFu</title>
        <meta name="description" content="BuFu platformasida ro'yxatdan o'ting va ishni boshlang." />
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Minimal header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black text-indigo-700">BuFu</Link>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Yordam kerakmi?</span>
            <Link href="/faq" className="font-semibold text-indigo-600 hover:underline">FAQ</Link>
          </div>
        </header>

        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-200">
          <div
            className="h-full bg-indigo-600 transition-all duration-500"
            style={{ width: progressWidth }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-lg">

            {/* ══ STEP 1: Role selection ══ */}
            {step === 1 && (
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Ro'yxatdan o'tish</h1>
                <p className="text-slate-500 mb-8">O'z faoliyatingizni boshlash uchun rolni tanlang</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {([
                    {
                      value: 'CLIENT',
                      icon: <Briefcase size={32} color="#4f46e5" />,
                      title: 'Ish beruvchi',
                      desc: "Men frilanserlarni yollash va professional loyihalarni amalga oshirishni xohlayman.",
                    },
                    {
                      value: 'FREELANCER',
                      icon: <User size={32} color="#4f46e5" />,
                      title: 'Frilanser',
                      desc: "Men o'z xizmatlarimni taklif qilish va loyihalarda ishtirok etish orqali pul topishni xohlayman.",
                    },
                  ] as { value: Role; icon: React.ReactElement; title: string; desc: string }[]).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRole(opt.value)}
                      className={`relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 text-center transition-all ${
                        role === opt.value
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{opt.title}</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{opt.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 mt-2 flex items-center justify-center ${
                        role === opt.value ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                      }`}>
                        {role === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!role}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
                >
                  Davom etish
                </button>
                <p className="mt-4 text-sm text-slate-500">
                  Akkauntingiz bormi?{' '}
                  <Link href="/account" className="text-indigo-600 font-semibold hover:underline">Kirish</Link>
                </p>
              </div>
            )}

            {/* ══ STEP 2: Profile info ══ */}
            {step === 2 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  BOSQICH 2 DAN 3
                </p>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
                  {role === 'FREELANCER' ? 'Frilanser profili' : 'Profil ma\'lumotlari'}
                </h2>
                <p className="text-slate-500 text-sm mb-6">
                  {role === 'FREELANCER'
                    ? "Mijozlar sizni yaxshiroq tanishi uchun asosiy ma'lumotlarni kiriting."
                    : "Siz 'Ish beruvchi' sifatida ro'yxatdan o'tyapsiz. Loyihalaringizni boshlash uchun quyidagi ma'lumotlarni to'ldiring."}
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      {role === 'FREELANCER' ? "To'liq ism va familiyangiz" : "To'liq ism-sharifingiz"}
                    </label>
                    <div className="relative">
                      <User size={16} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Masalan: Azizbek Temirov"
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>

                  {role === 'FREELANCER' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Kasbingiz / Mutaxassisligingiz</label>
                      <div className="relative">
                        <Briefcase size={16} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={profession}
                          onChange={e => setProfession(e.target.value)}
                          placeholder="Masalan: Grafik dizayner"
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Telefon raqamingiz</label>
                    <div className="relative">
                      <Phone size={16} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+998 -- --- -- --"
                        className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      />
                    </div>
                  </div>

                  {role === 'CLIENT' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Kompaniya nomi (ixtiyoriy)</label>
                      <div className="relative">
                        <Buildings size={16} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={company}
                          onChange={e => setCompany(e.target.value)}
                          placeholder="Kompaniya nomi bo'lsa"
                          className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                        />
                      </div>
                    </div>
                  )}

                  {role === 'CLIENT' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Faoliyat yo'nalishi (Sanoat)</label>
                      <div className="grid grid-cols-3 gap-2">
                        {INDUSTRIES.map(ind => (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => setIndustry(ind)}
                            className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                              industry === ind
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {role === 'FREELANCER' && (
                    <div>
                      <label className="text-xs font-bold text-slate-700 mb-1.5 block">Tajriba darajangiz</label>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { value: 'JUNIOR', label: 'Junior', icon: <TrendUp size={16} /> },
                          { value: 'MIDDLE', label: 'Middle', icon: <TrendUp size={16} /> },
                          { value: 'SENIOR', label: 'Senior', icon: <Sparkle size={16} /> },
                        ] as { value: Experience; label: string; icon: React.ReactElement }[]).map(exp => (
                          <button
                            key={exp.value}
                            type="button"
                            onClick={() => setExperience(exp.value)}
                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                              experience === exp.value
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                            }`}
                          >
                            {exp.icon}
                            {exp.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <ArrowLeft size={16} /> Orqaga
                  </button>
                  <button
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Keyingisi <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══ STEP 3: Skills + finish ══ */}
            {step === 3 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Muvaffaqiyatga bir qadam</p>
                  <span className="text-xs font-bold text-slate-500">3-qadam / 3</span>
                </div>
                <p className="text-slate-500 text-sm mb-6">O'z imkoniyatlaringizni ko'rsating va profilingizni yakunlang.</p>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">✦</div>
                    <p className="text-sm font-bold text-slate-900">Top ko'nikmalar</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Sizni loyihalar moslashtirish uchun 5 tagacha ko'nikma tanlang</p>

                  <div className="relative mb-3">
                    <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={addCustomSkill}
                      placeholder="Ko'nikma qo'shing (Enter bosing)..."
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map(s => (
                      <span key={s} className="inline-flex items-center gap-1 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        {s}
                        <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="ml-1 hover:opacity-70">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SKILLS.filter(s => !skills.includes(s)).slice(0, 10).map(s => (
                      <button
                        key={s}
                        onClick={() => skills.length < 5 && toggleSkill(s)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 bg-white hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">✎</div>
                    <p className="text-sm font-bold text-slate-900">O'zingiz haqida</p>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">Mijozlaringiz uchun o'z tajribangiz haqida qisqacha yozing.</p>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value.slice(0, 500))}
                    placeholder="Masalan: Men 5 yillik tajribaga ega UI/UX dizayner. Ko'plab startaplar bilan hamkorlik qilganman..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1 text-right">{bio.length} / 500 belgi</p>
                </div>

                <div className="mb-5 space-y-2.5">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-indigo-600"
                    />
                    <span className="text-xs text-slate-600">
                      Men <Link href="/terms" className="text-indigo-600 hover:underline">Foydalanish shartlari</Link> va <Link href="/privacy" className="text-indigo-600 hover:underline">Maxfiylik siyosati</Link> bilan tanishib chiqdim va ularga roziman.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className="mt-0.5 w-4 h-4 accent-indigo-600" />
                    <span className="text-xs text-slate-600">
                      Yangi ishlar va haftalik tavsiyalar haqida bildirishnomalar olishni xohlayman.
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Orqa qaytish
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!agreed || loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-xl transition-colors"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><CheckCircle size={18} weight="fill" /> Ro'yxatdan o'tishni yakunlash</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-6 py-8">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="font-black text-indigo-700 mb-2">BuFu</p>
              <p className="text-xs text-slate-500">Build Future — O'zbekistondagi eng yirik frilans platformasi.</p>
            </div>
            {[
              { title: 'Kompaniya', links: ['Biz haqimizda', 'Maqolalar', 'Narxlar'] },
              { title: 'Ijtimoiy tarmoqlar', links: ['Telegram', 'Instagram', 'LinkedIn'] },
              { title: 'Huquqiy', links: ['Maxfiylik siyosati', 'Foydalanish shartlari', 'FAQ'] },
            ].map(col => (
              <div key={col.title}>
                <p className="text-xs font-bold text-slate-700 mb-2">{col.title}</p>
                <ul className="space-y-1">
                  {col.links.map(l => (
                    <li key={l}><a href="#" className="text-xs text-slate-500 hover:text-indigo-600 transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-6">© 2024 BuFu (Build Future). Barcha huquqlar himoyalangan.</p>
        </footer>
      </div>
    </>
  );
};

export default RegisterPage;
