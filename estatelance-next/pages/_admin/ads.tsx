import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  ChartBar, Users, Gear, ArrowLeft, MagnifyingGlass, Plus,
  DotsThreeVertical, CheckCircle, XCircle, PauseCircle, Eye, Pencil, Trash
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
}

const MOCK_ADS: Ad[] = [
  { id: '1', title: 'PayUz Group — Senior Designer', advertiser: 'PayUz Group', type: 'SPONSORED_JOB', status: 'ACTIVE', budget: 500, spent: 230, clicks: 1240, impressions: 48000, startDate: '2024-01-10', endDate: '2024-02-10' },
  { id: '2', title: 'TechBridge LLC — Full Stack Dev', advertiser: 'TechBridge LLC', type: 'SPONSORED_JOB', status: 'ACTIVE', budget: 350, spent: 180, clicks: 890, impressions: 32000, startDate: '2024-01-15', endDate: '2024-02-15' },
  { id: '3', title: 'BuFu Mobil Ilova Banner', advertiser: 'BuFu Internal', type: 'BANNER', status: 'ACTIVE', budget: 0, spent: 0, clicks: 5600, impressions: 120000, startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: '4', title: 'Jasur — Premium Freelancer', advertiser: 'Jasur Toshmatov', type: 'FEATURED_FREELANCER', status: 'PAUSED', budget: 100, spent: 45, clicks: 340, impressions: 12000, startDate: '2024-01-05', endDate: '2024-02-05' },
  { id: '5', title: 'UzDev Conference Promo', advertiser: 'UzDev Org', type: 'BANNER', status: 'ENDED', budget: 200, spent: 200, clicks: 3200, impressions: 68000, startDate: '2023-12-01', endDate: '2023-12-31' },
  { id: '6', title: 'StartupHub Job Listing', advertiser: 'StartupHub', type: 'SPONSORED_JOB', status: 'PENDING', budget: 400, spent: 0, clicks: 0, impressions: 0, startDate: '2024-02-01', endDate: '2024-03-01' },
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

const AdminAdsPage = () => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdStatus | ''>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [ads, setAds] = useState<Ad[]>(MOCK_ADS);

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
              { label: 'Faol reklamalar', value: totalActive, color: 'text-emerald-600' },
              { label: 'Jami kliklar', value: totalClicks.toLocaleString(), color: 'text-indigo-600' },
              { label: 'Ko\'rishlar', value: (totalImpressions / 1000).toFixed(1) + 'K', color: 'text-purple-600' },
              { label: 'Jami daromad', value: '$' + totalRevenue, color: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-4">
                <p className="text-xs font-semibold text-slate-500 mb-1">{s.label}</p>
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
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">{ad.clicks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{(ad.impressions / 1000).toFixed(1)}K</td>
                      <td className="px-4 py-3 text-right font-bold text-indigo-600">${ad.spent}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1 relative">
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
    </>
  );
};

export default AdminAdsPage;
