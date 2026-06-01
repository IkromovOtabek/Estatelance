import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  MagnifyingGlass, Bell, CheckCircle, XCircle, Eye,
  ChartBar, Users, Gear, ArrowLeft, Briefcase,
  CurrencyDollar, Clock, Buildings, Tag
} from '@phosphor-icons/react';

interface Job {
  id: string;
  title: string;
  category: string;
  company: string;
  budget: string;
  timeAgo: string;
  description: string;
  skills: string[];
  experience: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: "E-commerce mobil ilovasi dizayni",
    category: "UI/UX Dizayn",
    company: "Global Soft LLC",
    budget: "$1,200 - $1,800",
    timeAgo: "2 soat oldin",
    description: "Bizga zamonaviy e-commerce ilovasi uchun to'liq UI/UX dizayn kerak. Figma'da barcha ekranlarni chizib berish, prototip yaratish va dizayn tizimini ishlab chiqish zarur.",
    skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
    experience: "Middle / Senior",
    status: "PENDING",
  },
  {
    id: '2',
    title: "Fintech Backend (Node.js)",
    category: "Dasturlash",
    company: "PayMe Clone Inc",
    budget: "$3,500",
    timeAgo: "45 daqiqa oldin",
    description: "To'lov tizimi uchun backend yaratish. Node.js/PostgreSQL asosida API, tranzaksiyalarni boshqarish, xavfsizlik talablariga javob berish zarur.",
    skills: ["Node.js", "PostgreSQL", "REST API", "AWS"],
    experience: "Senior",
    status: "PENDING",
  },
  {
    id: '3',
    title: "SMM va Digital Marketing",
    category: "Marketing",
    company: "Korzinka.uz",
    budget: "$600/oy",
    timeAgo: "5 soat oldin",
    description: "Ijtimoiy tarmoqlar uchun kontent rejasi, postlar tayyorlash, targetli reklama boshqaruvi.",
    skills: ["Instagram", "Telegram", "SMM", "Copywriting"],
    experience: "Middle",
    status: "PENDING",
  },
  {
    id: '4',
    title: "Python/Django o'qituvchisi kerak",
    category: "Ta'lim",
    company: "IT Academy",
    budget: "$800 - $1,200",
    timeAgo: "1 kun oldin",
    description: "Boshlang'ich darajadagi talabalar uchun Python va Django bo'yicha darslar o'tish.",
    skills: ["Python", "Django", "Teaching"],
    experience: "Senior",
    status: "PENDING",
  },
];

const catColors: Record<string, string> = {
  "UI/UX Dizayn": "bg-purple-50 text-purple-700",
  "Dasturlash":   "bg-blue-50 text-blue-700",
  "Marketing":    "bg-pink-50 text-pink-700",
  "Ta'lim":       "bg-amber-50 text-amber-700",
};

const ModerationPage = () => {
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [selected, setSelected] = useState<Job | null>(MOCK_JOBS[1]);
  const [search, setSearch] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = jobs.filter(j =>
    j.status === 'PENDING' &&
    (!search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
  );

  const approve = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'APPROVED' } : j));
    if (selected?.id === id) setSelected(null);
  };

  const reject = (id: string) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'REJECTED' } : j));
    if (selected?.id === id) setSelected(null);
    setRejectReason('');
  };

  const toggleCheck = (id: string) => {
    setChecked(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const bulkApprove = () => {
    setJobs(prev => prev.map(j => checked.includes(j.id) ? { ...j, status: 'APPROVED' } : j));
    setChecked([]);
  };

  const bulkReject = () => {
    setJobs(prev => prev.map(j => checked.includes(j.id) ? { ...j, status: 'REJECTED' } : j));
    setChecked([]);
  };

  return (
    <>
      <Head><title>Ishlar moderatsiyasi — BuFu Admin</title></Head>

      <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 fixed top-0 left-0 h-full flex flex-col py-6 px-3 z-30">
          <div className="px-3 mb-8">
            <h1 className="text-xl font-black text-indigo-700">BuFu</h1>
            <p className="text-xs text-slate-400">Admin Panel</p>
          </div>
          <nav className="flex-1 space-y-1">
            {[
              { href: '/_admin',             icon: <ChartBar size={18} />,    label: 'Boshqaruv paneli' },
              { href: '/_admin/moderation',  icon: <Briefcase size={18} />,   label: 'Ishlar moderatsiyasi', active: true },
              { href: '/messages',           icon: <Bell size={18} />,        label: 'Xabarlar' },
              { href: '/_admin/ads',         icon: <Tag size={18} />,         label: 'Moliya' },
              { href: '/_admin/users',       icon: <Users size={18} />,       label: 'Foydalanuvchilar' },
              { href: '/_admin/settings',    icon: <Gear size={18} />,        label: 'Sozlamalar' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  item.active ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.icon}{item.label}
              </Link>
            ))}
          </nav>
          <div className="px-3 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">A</div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Azizbek Temirov</p>
                <p className="text-[10px] text-slate-400">Admin</p>
              </div>
            </div>
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span>Bosh sahifaga</span>
            </Link>
          </div>
        </aside>

        {/* Main */}
        <main className="ml-64 flex-1 flex flex-col overflow-hidden" style={{ height: '100vh' }}>
          {/* Top bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Ishlar moderatsiyasi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tasdiqlash kutilayotgan loyihalar va ish e'lonlari</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Qidirish..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200 w-52"
                />
              </div>
              <button className="relative p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
                <Bell size={18} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Job list */}
            <div className="w-96 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col overflow-hidden">
              {/* Bulk actions */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={e => {
                      setSelectAll(e.target.checked);
                      setChecked(e.target.checked ? filtered.map(j => j.id) : []);
                    }}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  Barchasini tanlash
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={bulkReject}
                    disabled={checked.length === 0}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                  >
                    Rad etish
                  </button>
                  <button
                    onClick={bulkApprove}
                    disabled={checked.length === 0}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
                  >
                    Tasdiqlash
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
                    Moderatsiya uchun ishlar yo'q
                  </div>
                )}
                {filtered.map(job => (
                  <div
                    key={job.id}
                    onClick={() => setSelected(job)}
                    className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors ${
                      selected?.id === job.id ? 'bg-indigo-50 border-l-2 border-indigo-600' : 'hover:bg-slate-50 border-l-2 border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked.includes(job.id)}
                      onChange={() => toggleCheck(job.id)}
                      onClick={e => e.stopPropagation()}
                      className="mt-1 w-4 h-4 accent-indigo-600 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-semibold truncate ${selected?.id === job.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                          {job.title}
                        </p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${catColors[job.category] ?? 'bg-slate-100 text-slate-600'}`}>
                          {job.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Buildings size={11} /> {job.company}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <CurrencyDollar size={11} /> {job.budget}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                        <Clock size={10} /> {job.timeAgo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 overflow-y-auto bg-slate-50">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Eye size={40} className="mb-3 opacity-30" />
                  <p className="text-sm">Ko'rish uchun ishni tanlang</p>
                </div>
              ) : (
                <div className="p-6 max-w-2xl">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Loyiha tafsilotlari</p>

                  {/* Header */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="text-lg font-extrabold text-slate-900">{selected.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${catColors[selected.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {selected.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1"><Buildings size={14} /> {selected.company}</span>
                      <span className="flex items-center gap-1"><CurrencyDollar size={14} /> {selected.budget}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {selected.timeAgo}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{selected.description}</p>
                  </div>

                  {/* Skills + experience */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-4">
                    <p className="text-xs font-bold text-slate-700 mb-2">Ko'nikmalar</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selected.skills.map(s => (
                        <span key={s} className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 bg-slate-50">{s}</span>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-slate-700 mb-1">Tajriba darajasi</p>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">{selected.experience}</span>
                  </div>

                  {/* Reject reason */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5">
                    <p className="text-xs font-bold text-slate-700 mb-2">Rad etish sababi (ixtiyoriy)</p>
                    <textarea
                      rows={3}
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Masalan: Noto'g'ri kategoriya tanlangan, tavsif yetarli emas..."
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 text-right">{rejectReason.length} / 500 belgi</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => reject(selected.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors"
                    >
                      <XCircle size={18} weight="fill" /> Rad etish
                    </button>
                    <button
                      onClick={() => approve(selected.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
                    >
                      <CheckCircle size={18} weight="fill" /> Tasdiqlash
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default ModerationPage;
