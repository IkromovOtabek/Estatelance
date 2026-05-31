import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Rocket, Star, MapPin, Bookmark, ArrowRight, Megaphone, Download } from '@phosphor-icons/react';
import withLayoutBasic from '../../libs/components/layout/LayoutBasic';

const MOCK_SPONSORED = [
  {
    id: '1',
    title: 'Senior Product Designer (FinTech)',
    company: 'PayUz Group',
    location: "Toshkent, O'zbekiston",
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    budget: '$1,200 - $2,500',
    badge: 'TOP',
  },
  {
    id: '2',
    title: 'Full-Stack Developer (React + Node.js)',
    company: 'TechBridge LLC',
    location: 'Remote',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    budget: '$800 - $1,800',
    badge: 'VIP',
  },
];

const MOCK_PROMOS = [
  {
    id: '1',
    title: "BuFu mobil ilovasi endi jonli efirda!",
    desc: "O'zbekistondagi eng yirik frilans platformasi endi cho'ntagingizda. Ilovani yuklab oling va birinchi buyurtmangizni oling.",
    type: 'banner',
  },
  {
    id: '2',
    title: "Yangi: Video Portfolio funksiyasi!",
    desc: "Endi o'z ishlaringizni video orqali namoyish eting. Mijozlar sizni tezroq topsin.",
    type: 'feature',
  },
];

const MOCK_FREELANCERS = [
  { id: '1', name: 'Jasur Toshmatov', title: 'UI/UX Designer', rate: '$25/soat', badge: 'PRO', rating: 4.9, skills: ['Figma', 'Adobe XD'] },
  { id: '2', name: 'Nilufar Yusupova', title: 'React Developer', rate: '$30/soat', badge: 'TOP', rating: 5.0, skills: ['React', 'TypeScript'] },
  { id: '3', name: 'Bobur Karimov', title: 'Mobile Developer', rate: '$28/soat', badge: 'VIP', rating: 4.8, skills: ['Flutter', 'Dart'] },
];

const badgeColors: Record<string, string> = {
  TOP: 'bg-amber-50 text-amber-700 border border-amber-200',
  PRO: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  VIP: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const AdsPage = () => {
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const toggleSave = (id: string) => {
    setSavedJobs(prev => prev.includes(id) ? prev.filter(j => j !== id) : [...prev, id]);
  };

  return (
    <>
      <Head>
        <title>E'lonlar va Reklamalar — BuFu</title>
        <meta name="description" content="BuFu platformasidagi tanlangan e'lonlar, homiylik ishlar va maxsus takliflar." />
      </Head>

      {/* Hero Banner */}
      <section className="mb-10 rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),transparent)]" />
        <div className="relative z-10 flex items-center gap-6 text-center md:text-left">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30 flex-shrink-0">
            <Rocket size={32} color="white" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white mb-1">{MOCK_PROMOS[0].title}</h2>
            <p className="text-white/90 text-sm max-w-xl">{MOCK_PROMOS[0].desc}</p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3 flex-shrink-0">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl shadow hover:bg-indigo-50 transition-colors">
            <Download size={16} />
            Yuklab olish
          </button>
          <button className="px-5 py-2.5 border border-white/40 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-colors">
            Batafsil
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Siz uchun tavsiyalar</h3>
            <Link href="/jobs" className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:underline">
              Barchasini ko'rish <ArrowRight size={14} />
            </Link>
          </div>

          {MOCK_SPONSORED.map(job => (
            <div key={job.id} className="bg-white border-2 border-indigo-100 rounded-2xl p-5 relative hover:shadow-md transition-all group">
              {/* Sponsored badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200">
                <Star size={11} weight="fill" />
                Homiylik
              </div>

              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-2xl font-bold text-indigo-600">
                  {job.company[0]}
                </div>
                <div className="flex-1 min-w-0 pr-20">
                  <h4 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h4>
                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                    {job.company}
                    <span className="text-slate-300">•</span>
                    <MapPin size={12} />
                    {job.location}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {job.skills.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded border border-slate-200 text-slate-600 bg-white">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColors[job.badge]}`}>{job.badge}</span>
                  <span className="text-base font-extrabold text-indigo-600">{job.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSave(job.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <Bookmark size={16} weight={savedJobs.includes(job.id) ? 'fill' : 'regular'} />
                  </button>
                  <Link href={`/jobs/${job.id}`} className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors">
                    Batafsil
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Feature announcement */}
          <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-indigo-100 flex items-center justify-center flex-shrink-0">
              <Megaphone size={24} color="#4f46e5" weight="fill" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{MOCK_PROMOS[1].title}</p>
              <p className="text-sm text-slate-600 mt-1">{MOCK_PROMOS[1].desc}</p>
              <button className="mt-3 text-sm font-semibold text-indigo-600 hover:underline flex items-center gap-1">
                Ko'proq bilib oling <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar: sponsored freelancers + ad CTA */}
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Premium Frilanserlar</h4>
              <Link href="/browse" className="text-xs font-semibold text-indigo-600 hover:underline">
                Hammasi
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_FREELANCERS.map(f => (
                <div key={f.id} className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {f.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{f.name}</p>
                    <p className="text-xs text-slate-500 truncate">{f.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-green-700">{f.rate}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeColors[f.badge]}`}>{f.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advertise CTA */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white">
            <Rocket size={28} color="white" weight="fill" className="mb-3" />
            <h4 className="font-bold text-base mb-1">O'z e'loningizni joylashtiring</h4>
            <p className="text-sm text-white/80 mb-4">BuFu'da reklama qilib minglab mutaxassislarga yeting.</p>
            <Link href="/pricing" className="block text-center bg-white text-indigo-700 text-sm font-bold py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
              Boost olish
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default withLayoutBasic(AdsPage);
