import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChartBar, Users, Gear, ArrowLeft, MagnifyingGlass, Plus,
  DotsThreeVertical, CheckCircle, XCircle, PauseCircle, Eye, Pencil, Trash,
  CursorClick, TrendUp, X, ArrowUp, ArrowDown, ChartLine
} from '@phosphor-icons/react';

type AdStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'PENDING';

interface Ad {
  id: string;
  title: string;
  advertiser: string;
  type: 'BANNER' | 'SPONSORED_JOB' | 'FEATURED_FREELANCER';
  status: AdStatus;
  budget: number;
  spent: number;
  clicks: number;
  impressions: number;
  startDate: string;
  endDate: string;
  targetUrl?: string;
  // daily stats for chart
  dailyStats?: { date: string; views: number; clicks: number }[];
}

const MOCK_ADS: Ad[] = [
  {
    id: '1', title: 'PayUz Group — Senior Designer', advertiser: 'PayUz Group',
    type: 'SPONSORED_JOB', status: 'ACTIVE', budget: 500, spent: 230,
    clicks: 1240, impressions: 48000, startDate: '2024-01-10', endDate: '2024-02-10',
    targetUrl: 'https://bufu.uz/jobs/123',
    dailyStats: [
      { date: '01-10', views: 3200, clicks: 82 },
      { date: '01-11', views: 4100, clicks: 95 },
      { date: '01-12', views: 3800, clicks: 110 },
      { date: '01-13', views: 5200, clicks: 148 },
      { date: '01-14', views: 6100, clicks: 175 },
      { date: '01-15', views: 5800, clicks: 160 },
      { date: '01-16', views: 6400, clicks: 190 },
    ],
  },
  {
    id: '2', title: 'TechBridge LLC — Full Stack Dev', advertiser: 'TechBridge LLC',
    type: 'SPONSORED_JOB', status: 'ACTIVE', budget: 350, spent: 180,
    clicks: 890, impressions: 32000, startDate: '2024-01-15', endDate: '2024-02-15',
    targetUrl: 'https://bufu.uz/jobs/456',
    dailyStats: [
      { date: '01-15', views: 2100, clicks: 55 },
      { date: '01-16', views: 2800, clicks: 72 },
      { date: '01-17', views: 3400, clicks: 88 },
      { date: '01-18', views: 4200, clicks: 112 },
      { date: '01-19', views: 3900, clicks: 98 },
      { date: '01-20', views: 5100, clicks: 134 },
      { date: '01-21', views: 4800, clicks: 122 },
    ],
  },
  {
    id: '3', title: 'BuFu Mobil Ilova Banner', advertiser: 'BuFu Internal',
    type: 'BANNER', status: 'ACTIVE', budget: 0, spent: 0,
    clicks: 5600, impressions: 120000, startDate: '2024-01-01', endDate: '2024-12-31',
    targetUrl: 'https://bufu.uz/app',
    dailyStats: [
      { date: '01-10', views: 15000, clicks: 680 },
      { date: '01-11', views: 17200, clicks: 780 },
      { date: '01-12', views: 16800, clicks: 740 },
      { date: '01-13', views: 18400, clicks: 840 },
      { date: '01-14', views: 20000, clicks: 920 },
      { date: '01-15', views: 19200, clicks: 880 },
      { date: '01-16', views: 21000, clicks: 980 },
    ],
  },
  {
    id: '4', title: 'Jasur — Premium Freelancer', advertiser: 'Jasur Toshmatov',
    type: 'FEATURED_FREELANCER', status: 'PAUSED', budget: 100, spent: 45,
    clicks: 340, impressions: 12000, startDate: '2024-01-05', endDate: '2024-02-05',
    targetUrl: 'https://bufu.uz/profile/jasur',
    dailyStats: [
      { date: '01-05', views: 1800, clicks: 48 },
      { date: '01-06', views: 2100, clicks: 55 },
      { date: '01-07', views: 1600, clicks: 40 },
      { date: '01-08', views: 1900, clicks: 52 },
      { date: '01-09', views: 2200, clicks: 62 },
      { date: '01-10', views: 1400, clicks: 38 },
      { date: '01-11', views: 800, clicks: 22 },
    ],
  },
  {
    id: '5', title: 'UzDev Conference Promo', advertiser: 'UzDev Org',
    type: 'BANNER', status: 'ENDED', budget: 200, spent: 200,
    clicks: 3200, impressions: 68000, startDate: '2023-12-01', endDate: '2023-12-31',
    targetUrl: 'https://uzdev.uz',
    dailyStats: [],
  },
  {
    id: '6', title: 'StartupHub Job Listing', advertiser: 'StartupHub',
    type: 'SPONSORED_JOB', status: 'PENDING', budget: 400, spent: 0,
    clicks: 0, impressions: 0, startDate: '2024-02-01', endDate: '2024-03-01',
    targetUrl: 'https://bufu.uz/jobs/789',
    dailyStats: [],
  },
];

const statusMeta: Record<AdStatus, { label: string; color: string; icon: React.ReactElement }> = {
  ACTIVE: { label: 'Faol', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={12} weight="fill" /> },
  PAUSED: { label: 'Pauza', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <PauseCircle size={12} weight="fill" /> },
  ENDED: { label: 'Tugagan', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <XCircle size={12} weight="fill" /> },
  PENDING: { label: 'Kutilmoqda', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Eye size={12} weight="fill" /> },
};

const typeLabel: Record<string, string> = {
  BANNER: 'Banner',
  SPONSORED_JOB: 'Homiylik ish',
  FEATURED_FREELANCER: 'Premium frilanser',
};

// Mini sparkline bar chart
const MiniBarChart = ({ data }: { data: { date: string; views: number; clicks: number }[] }) => {
  if (!data.length) return <p className="text-xs text-slate-400 text-center py-4">Ma'lumot yo'q</p>;
  const maxViews = Math.max(...data.map(d => d.views));
  const maxClicks = Math.max(...data.map(d => d.clicks));
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col gap-0.5 items-center group relative">
          <div
            className="w-full bg-indigo-200 rounded-sm hover:bg-indigo-400 transition-colors cursor-pointer"
            style={{ height: `${(d.views / maxViews) * 40}px` }}
          />
          <div
            className="w-full bg-emerald-400 rounded-sm hover:bg-emerald-600 transition-colors cursor-pointer"
            style={{ height: `${(d.clicks / maxClicks) * 18}px` }}
          />
          <span className="text-[9px] text-slate-400 mt-0.5">{d.date}</span>
          {/* Tooltip */}
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
            👁 {d.views.toLocaleString()} | 🖱 {d.clicks}
          </div>
        </div>
      ))}
    </div>
  );
};

const AdminAdsPage = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdStatus | ''>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [ads, setAds] = useState<Ad[]>(MOCK_ADS);
  const [statsAd, setStatsAd] = useState<Ad | null>(null);

  const filtered = ads.filter(ad => {
    if (filterStatus && ad.status !== filterStatus) return false;
    if (search && !ad.title.toLowerCase().includes(search.toLowerCase()) && !ad.advertiser.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalActive = ads.filter(a => a.status === 'ACTIVE').length;
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalRevenue = ads.reduce((s, a) => s + a.spent, 0);

  const deleteAd = (id: string) => {
    setAds(prev => prev.filter(a => a.id !== id));
    setMenuOpenId(null);
  };

  const toggleStatus = (id: string) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : a));
    setMenuOpenId(null);
  };

  const ctr = (ad: Ad) => ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';

  return (
    <>
      <Head><title>Reklamalar — BuFu Admin</title></Head>

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
                  (item as any).active
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
        <main className="ml-64 flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Reklamalar boshqaruvi</h2>
              <p className="text-slate-500 text-sm mt-0.5">Barcha e'lon va reklama kampaniyalarini boshqaring</p>
            </div>
            <Link
              href="/_admin/ads/create"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={16} />
              Yangi reklama
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Faol reklamalar', value: totalActive, color: 'text-emerald-600', icon: <CheckCircle size={18} color="#10b981" /> },
              { label: 'Jami kliklar', value: totalClicks.toLocaleString(), color: 'text-indigo-600', icon: <CursorClick size={18} color="#4f46e5" /> },
              { label: "Ko'rishlar", value: (totalImpressions / 1000).toFixed(1) + 'K', color: 'text-purple-600', icon: <Eye size={18} color="#a855f7" /> },
              { label: 'Jami daromad', value: '$' + totalRevenue, color: 'text-amber-600', icon: <TrendUp size={18} color="#f59e0b" /> },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">{s.icon}</div>
                  <ArrowUp size={12} color="#10b981" />
                </div>
                <p className="text-xs font-semibold text-slate-500 mb-0.5">{s.label}</p>
                <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative">
              <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Qidirish..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as AdStatus | '')}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">Barcha statuslar</option>
              <option value="ACTIVE">Faol</option>
              <option value="PAUSED">Pauza</option>
              <option value="PENDING">Kutilmoqda</option>
              <option value="ENDED">Tugagan</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Reklama</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Turi</th>
                  <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Kliklar</th>
                  <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Ko'rishlar</th>
                  <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">CTR</th>
                  <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Sarflangan</th>
                  <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(ad => {
                  const st = statusMeta[ad.status];
                  return (
                    <tr key={ad.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-900">{ad.title}</p>
                        <p className="text-xs text-slate-400">{ad.advertiser}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">{typeLabel[ad.type]}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-indigo-600">{ad.clicks.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">{(ad.impressions / 1000).toFixed(1)}K</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${parseFloat(ctr(ad)) > 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                          {ctr(ad)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">${ad.spent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 relative">
                          <button
                            onClick={() => setStatsAd(ad)}
                            className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors text-indigo-400 hover:text-indigo-600"
                            title="Statistika"
                          >
                            <ChartLine size={16} />
                          </button>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === ad.id ? null : ad.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
                          >
                            <DotsThreeVertical size={16} />
                          </button>
                          {menuOpenId === ad.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 w-44 overflow-hidden">
                              <button
                                onClick={() => toggleStatus(ad.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <PauseCircle size={14} />
                                {ad.status === 'ACTIVE' ? 'Pauzaga qo\'yish' : 'Faollashtirish'}
                              </button>
                              <Link
                                href={`/_admin/ads/create?id=${ad.id}`}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <Pencil size={14} /> Tahrirlash
                              </Link>
                              <button
                                onClick={() => deleteAd(ad.id)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash size={14} /> O'chirish
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">Reklama topilmadi</div>
            )}
          </div>
        </main>
      </div>

      {/* Stats Modal */}
      {statsAd && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={e => { if (e.target === e.currentTarget) setStatsAd(null); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{statsAd.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{statsAd.advertiser} · {typeLabel[statsAd.type]}</p>
              </div>
              <button
                onClick={() => setStatsAd(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stats grid */}
            <div className="px-6 py-4 grid grid-cols-2 gap-3">
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye size={14} color="#4f46e5" />
                  <span className="text-xs font-semibold text-indigo-700">Jami ko'rishlar</span>
                </div>
                <p className="text-2xl font-extrabold text-indigo-700">{statsAd.impressions.toLocaleString()}</p>
                <p className="text-xs text-indigo-400 mt-0.5">Reklama namoyish qilingan</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CursorClick size={14} color="#10b981" />
                  <span className="text-xs font-semibold text-emerald-700">Havola kliklar</span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700">{statsAd.clicks.toLocaleString()}</p>
                <p className="text-xs text-emerald-400 mt-0.5">Link bosilgan marta</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendUp size={14} color="#a855f7" />
                  <span className="text-xs font-semibold text-purple-700">CTR</span>
                </div>
                <p className="text-2xl font-extrabold text-purple-700">{ctr(statsAd)}%</p>
                <p className="text-xs text-purple-400 mt-0.5">
                  {parseFloat(ctr(statsAd)) > 2
                    ? <span className="flex items-center gap-0.5"><ArrowUp size={10} />Yuqori CTR</span>
                    : <span className="flex items-center gap-0.5"><ArrowDown size={10} />Past CTR</span>
                  }
                </p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <ChartBar size={14} color="#f59e0b" />
                  <span className="text-xs font-semibold text-amber-700">Sarflangan</span>
                </div>
                <p className="text-2xl font-extrabold text-amber-700">${statsAd.spent}</p>
                <p className="text-xs text-amber-400 mt-0.5">Byudjet: ${statsAd.budget || '∞'}</p>
              </div>
            </div>

            {/* Target URL */}
            {statsAd.targetUrl && (
              <div className="px-6 pb-2">
                <p className="text-xs font-semibold text-slate-500 mb-1">Havola manzili</p>
                <a
                  href={statsAd.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline truncate block"
                >
                  {statsAd.targetUrl}
                </a>
              </div>
            )}

            {/* Daily chart */}
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700">Kunlik statistika</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-200 rounded-sm inline-block" />Ko'rishlar</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 rounded-sm inline-block" />Kliklar</span>
                </div>
              </div>
              <MiniBarChart data={statsAd.dailyStats ?? []} />
            </div>

            {/* Dates */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-400">
              <span>Boshlanish: <strong className="text-slate-600">{statsAd.startDate}</strong></span>
              <span>Tugash: <strong className="text-slate-600">{statsAd.endDate}</strong></span>
              <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border ${statusMeta[statsAd.status].color}`}>
                {statusMeta[statsAd.status].icon} {statusMeta[statsAd.status].label}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAdsPage;
