import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import {
  MagnifyingGlass, Plus, DotsThreeVertical, CheckCircle, PauseCircle, Eye, Trash,
  CursorClick, TrendUp, ArrowUp, NotePencil,
} from '@phosphor-icons/react';
import { ADMIN_GET_AD_TARGETS } from '../../../apollo/admin/query';
import {
  ADMIN_REMOVE_AD_TARGET,
  ADMIN_SET_AD_TARGET_STATUS,
} from '../../../apollo/admin/mutation';
import {
  type AdStatus,
  type AdminAdTargetRow,
  AD_TYPE_LABEL,
  adCtr,
  normalizeAdStatus,
  normalizeAdType,
} from '../../admin/ad-targets';
import { AD_STATUS_FILTER_OPTIONS, adminTargetsRecordHref } from '../../admin/admin-config';
import TargetHrefLink from './TargetHrefLink';

const statusMeta: Record<AdStatus, { label: string; color: string; icon: React.ReactElement }> = {
  ACTIVE: { label: 'Faol', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle size={12} weight="fill" /> },
  PAUSED: { label: 'Pauza', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <PauseCircle size={12} weight="fill" /> },
  ENDED: { label: 'Tugagan', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <Eye size={12} /> },
  PENDING: { label: 'Kutilmoqda', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Eye size={12} /> },
};

const typeLabel = AD_TYPE_LABEL;
const cardCls = 'bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl';
const inputCls =
  'border border-slate-200 dark:border-[#334155] bg-white dark:bg-[#1e293b] text-slate-800 dark:text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30';

interface AdminAdsPanelProps {
  onCreate?: () => void;
}

export default function AdminAdsPanel({ onCreate }: AdminAdsPanelProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<AdStatus | ''>('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data, loading, refetch } = useQuery(ADMIN_GET_AD_TARGETS, {
    fetchPolicy: 'network-only',
  });
  const [setTargetStatus] = useMutation(ADMIN_SET_AD_TARGET_STATUS);
  const [removeTarget] = useMutation(ADMIN_REMOVE_AD_TARGET);

  const ads: AdminAdTargetRow[] = useMemo(() => {
    const raw = data?.adminGetAdTargets ?? [];
    return raw.map((row: AdminAdTargetRow) => ({
      ...row,
      type: normalizeAdType(row.type),
      status: normalizeAdStatus(row.status),
    }));
  }, [data]);

  const filtered = ads.filter((ad) => {
    if (filterStatus && ad.status !== filterStatus) return false;
    if (
      search &&
      !ad.title.toLowerCase().includes(search.toLowerCase()) &&
      !ad.advertiser.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalActive = ads.filter((a) => a.status === 'ACTIVE').length;
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);

  const deleteAd = async (ad: AdminAdTargetRow) => {
    if (!ad.sourceId || !ad.deletable) return;
    if (!window.confirm(`"${ad.title}" ni o'chirasizmi?`)) return;
    await removeTarget({ variables: { sourceKind: ad.sourceKind, sourceId: ad.sourceId } });
    await refetch();
    setMenuOpenId(null);
  };

  const openRecordInTargets = (ad: AdminAdTargetRow) => {
    if (!ad.sourceId) return;
    const kind =
      ad.sourceKind === 'announcement'
        ? 'announcement'
        : ad.sourceKind === 'user'
          ? 'user'
          : 'job';
    router.push(adminTargetsRecordHref(ad.sourceId, kind));
  };

  const toggleStatus = async (ad: AdminAdTargetRow) => {
    if (!ad.sourceId || !ad.manageable) return;
    await setTargetStatus({
      variables: {
        sourceKind: ad.sourceKind,
        sourceId: ad.sourceId,
        active: ad.status !== 'ACTIVE',
      },
    });
    await refetch();
    setMenuOpenId(null);
  };

  return (
    <div>
      {onCreate && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={onCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Yangi reklama
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Faol reklamalar', value: totalActive, color: 'text-emerald-600', icon: <CheckCircle size={18} color="#10b981" /> },
          { label: 'Jami kliklar', value: totalClicks.toLocaleString(), color: 'text-indigo-600', icon: <CursorClick size={18} color="#4f46e5" /> },
          { label: "Ko'rishlar", value: `${(totalImpressions / 1000).toFixed(1)}K`, color: 'text-purple-600', icon: <Eye size={18} color="#a855f7" /> },
          { label: 'Jami targetlar', value: ads.length, color: 'text-amber-600', icon: <TrendUp size={18} color="#f59e0b" /> },
        ].map((s) => (
          <div key={s.label} className={`${cardCls} p-4`}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-slate-50 dark:bg-[#1e293b] rounded-lg flex items-center justify-center">{s.icon}</div>
              <ArrowUp size={12} color="#10b981" />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-0.5">{s.label}</p>
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative">
          <MagnifyingGlass size={14} color="#94a3b8" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-8 pr-4 py-2 ${inputCls}`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AdStatus | '')}
          className={`px-3 py-2 ${inputCls}`}
        >
          {AD_STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
        >
          Yangilash
        </button>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        {loading ? (
          <p className="text-center py-12 text-sm text-slate-400">Yuklanmoqda...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#1e293b] bg-slate-50 dark:bg-[#1e293b]/50">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-5 py-3">Reklama</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Turi</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Kliklar</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Ko&apos;rishlar</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">CTR</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Havola</th>
                <th className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider px-4 py-3">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
              {filtered.map((ad) => {
                const st = statusMeta[ad.status];
                return (
                  <tr key={ad.id} className="hover:bg-slate-50 dark:hover:bg-[#1e293b]/40 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{ad.title}</p>
                      <p className="text-xs text-slate-400">{ad.advertiser}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {typeLabel[ad.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                        {st.icon} {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-600">{ad.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-500">{(ad.impressions / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          parseFloat(adCtr(ad)) > 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'
                        }`}
                      >
                        {adCtr(ad)}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <TargetHrefLink targetUrl={ad.targetUrl} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 relative">
                        <button
                          type="button"
                          onClick={() => openRecordInTargets(ad)}
                          disabled={!ad.sourceId}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 disabled:opacity-40"
                          title="Yozuv — Targetlar bo‘limida"
                        >
                          <NotePencil size={14} /> Yozuv
                        </button>
                        <button
                          type="button"
                          onClick={() => setMenuOpenId(menuOpenId === ad.id ? null : ad.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e293b] text-slate-500"
                        >
                          <DotsThreeVertical size={16} />
                        </button>
                        {menuOpenId === ad.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-xl shadow-lg z-10 w-44 overflow-hidden">
                            {ad.manageable && (
                              <button
                                type="button"
                                onClick={() => toggleStatus(ad)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              >
                                <PauseCircle size={14} />
                                {ad.status === 'ACTIVE' ? "Pauzaga qo'yish" : 'Faollashtirish'}
                              </button>
                            )}
                            {ad.deletable && (
                              <button
                                type="button"
                                onClick={() => deleteAd(ad)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                              >
                                <Trash size={14} /> O&apos;chirish
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">Reklama topilmadi</div>
        )}
      </div>

    </div>
  );
}
