import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, ChartBar, Users, Gear, Eye, CheckCircle, Image, Megaphone, RocketLaunch } from '@phosphor-icons/react';

type AdType = 'BANNER' | 'SPONSORED_JOB' | 'FEATURED_FREELANCER';

const CreateAdPage = () => {
  const router = useRouter();
  const [adType, setAdType] = useState<AdType>('BANNER');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const audiences = ['Frilanserlar', 'Ish beruvchilar', 'Junior mutaxassislar', 'Senior mutaxassislar', "IT soha mutaxassislari", 'Dizaynerlar'];

  const toggleAudience = (a: string) => {
    setTargetAudience(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    router.push('/_admin/ads');
  };

  const typeOptions: { value: AdType; label: string; desc: string; icon: React.ReactElement }[] = [
    { value: 'BANNER', label: 'Banner reklama', desc: "Sahifa tepasida ko'rinadigan katta banner", icon: <Image size={20} color="#4f46e5" /> },
    { value: 'SPONSORED_JOB', label: 'Homiylik ishi', desc: "Ishlar ro'yxatida yuqorida ko'rsatiladi", icon: <RocketLaunch size={20} color="#7c3aed" /> },
    { value: 'FEATURED_FREELANCER', label: 'Premium frilanser', desc: 'Frilanser kartasini ajratib ko\'rsatish', icon: <Megaphone size={20} color="#0ea5e9" /> },
  ];

  return (
    <>
      <Head><title>Yangi reklama yaratish — BuFu Admin</title></Head>

      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 fixed top-0 left-0 h-full flex flex-col py-6 px-3 z-30">
          <div className="px-3 mb-8">
            <h1 className="text-xl font-black text-indigo-700">BuFu Admin</h1>
            <p className="text-xs text-slate-500 mt-0.5">Marketplace Controller</p>
          </div>
          <nav className="flex-1 space-y-1">
            {[
              { href: '/_admin', icon: <ChartBar size={18} />, label: 'Dashboard' },
              { href: '/_admin/users', icon: <Users size={18} />, label: 'Foydalanuvchilar' },
              { href: '/_admin/moderation', icon: <Eye size={18} />, label: 'Moderatsiya' },
              { href: '/_admin/ads', icon: <CheckCircle size={18} />, label: 'Reklamalar', active: true },
              { href: '/_admin/settings', icon: <Gear size={18} />, label: 'Sozlamalar' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  item.active
                    ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="px-3 pt-4 border-t border-slate-100">
            <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-800">
              <ArrowLeft size={14} /> Saytga qaytish
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-64 flex-1 p-8 max-w-4xl">
          <Link href="/_admin/ads" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
            <ArrowLeft size={16} /> Reklamalarga qaytish
          </Link>

          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900">Yangi reklama yaratish</h2>
            <p className="text-slate-500 text-sm mt-1">Reklama kampaniyasi turini tanlang va ma'lumotlarni kiriting</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ad Type */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Reklama turi</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAdType(opt.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      adType === opt.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="mb-2">{opt.icon}</div>
                    <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Asosiy ma'lumotlar</h3>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Reklama sarlavhasi *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Masalan: Senior Designer kerak — PayUz Group"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tavsif</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Reklama mazmuni yoki qo'shimcha ma'lumot..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Havola (URL)</label>
                <input
                  type="url"
                  value={targetUrl}
                  onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://bufu.uz/jobs/..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Budget & Schedule */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Byudjet va jadval</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Byudjet ($)</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(e.target.value)}
                    placeholder="100"
                    min={0}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Boshlanish sanasi</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Tugash sanasi</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
              </div>
            </div>

            {/* Target audience */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Maqsadli auditoriya</h3>
              <div className="flex flex-wrap gap-2">
                {audiences.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAudience(a)}
                    className={`text-sm px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      targetAudience.includes(a)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                Reklama yaratish
              </button>
              <Link
                href="/_admin/ads"
                className="px-6 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Bekor qilish
              </Link>
            </div>
          </form>
        </main>
      </div>
    </>
  );
};

export default CreateAdPage;
