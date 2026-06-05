import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQuery } from '@apollo/client';
import { ADMIN_GET_AD_TARGETS } from '../../../apollo/admin/query';
import {
  ADMIN_REMOVE_AD_TARGET,
  ADMIN_SET_AD_TARGET_STATUS,
} from '../../../apollo/admin/mutation';
import {
  AD_STATUS_FILTER_OPTIONS,
  adminSectionHref,
  ADMIN_SECTION_IDS,
} from '../../admin/admin-config';
import {
  AdminAdTargetRow,
  AD_STATUS_META,
  AD_TYPE_LABEL,
  adCtr,
  normalizeAdStatus,
  normalizeAdType,
} from '../../admin/ad-targets';
import AdminTargetQuickLinks from './AdminTargetQuickLinks';
import TargetHrefLink from './TargetHrefLink';

interface AdminTargetsPanelProps {
  defaultStatusFilter?: string;
}

export default function AdminTargetsPanel({ defaultStatusFilter = '' }: AdminTargetsPanelProps) {
  const router = useRouter();
  const focusSourceId =
    typeof router.query.sourceId === 'string' ? router.query.sourceId : undefined;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(defaultStatusFilter);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(ADMIN_GET_AD_TARGETS, {
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
    if (search) {
      const q = search.toLowerCase();
      return (
        ad.title.toLowerCase().includes(q) ||
        ad.advertiser.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = ads.filter((a) => a.status === 'ACTIVE').length;
  const paymentsHref = adminSectionHref(ADMIN_SECTION_IDS.payments);

  useEffect(() => {
    if (!focusSourceId || loading) return;
    const el = document.getElementById(`admin-target-row-${focusSourceId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusSourceId, loading, filtered.length]);

  const handleDelete = async (ad: AdminAdTargetRow) => {
    if (!ad.sourceId || !ad.deletable) return;
    const msg =
      ad.sourceKind === 'job'
        ? `"${ad.title}" boostini butunlay bekor qilasizmi? Ish oddiy ro'yxat tartibiga qaytadi.`
        : ad.sourceKind === 'user'
          ? `"${ad.title}" profil boostini butunlay bekor qilasizmi?`
          : `"${ad.title}" reklama e'lonini o'chirasizmi?`;
    if (!window.confirm(msg)) return;
    setTogglingId(ad.id);
    try {
      await removeTarget({
        variables: { sourceKind: ad.sourceKind, sourceId: ad.sourceId },
      });
      await refetch();
    } finally {
      setTogglingId(null);
    }
  };

  const handlePauseStart = async (ad: AdminAdTargetRow) => {
    if (!ad.sourceId || !ad.manageable) return;
    const active = ad.status !== 'ACTIVE';
    setTogglingId(ad.id);
    try {
      await setTargetStatus({
        variables: {
          sourceKind: ad.sourceKind,
          sourceId: ad.sourceId,
          active,
        },
      });
      await refetch();
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center py-12 text-sm text-red-500">
        Targetlarni yuklashda xato: {error.message}
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Faol targetlar</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Jami</p>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">{ads.length}</p>
        </div>
        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl p-4 col-span-2 lg:col-span-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ma&apos;lumotlar API dan. Ikonkalar: pauza, start, to&apos;lovlar, o&apos;chirish.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Target qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-3 pr-4 py-2 border border-slate-200 dark:border-[#1e293b] rounded-xl text-sm bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[200px]"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-[#1e293b] rounded-xl text-sm bg-white dark:bg-[#0f172a] text-slate-800 dark:text-slate-200"
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
        <AdminTargetQuickLinks className="ml-auto" />
      </div>

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-[#1e293b] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1e293b]/50 border-b border-slate-200 dark:border-[#1e293b]">
                <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Target</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Turi</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-right">Ko&apos;rish</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-right">Takliflar</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-right">CTR</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Havola</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase text-right">Boshqaruv</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1e293b]">
              {filtered.map((ad) => {
                const st = AD_STATUS_META[ad.status];
                const typeKey = normalizeAdType(ad.type);
                const isBusy = togglingId === ad.id;
                const showPause = ad.manageable && ad.status === 'ACTIVE';
                const showStart = ad.manageable && ad.status === 'PAUSED';

                const isFocused = focusSourceId && ad.sourceId === focusSourceId;
                return (
                  <tr
                    key={ad.id}
                    id={ad.sourceId ? `admin-target-row-${ad.sourceId}` : undefined}
                    className={`hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/40 transition-colors ${
                      isFocused ? 'bg-indigo-50/80 dark:bg-indigo-950/30 ring-1 ring-inset ring-indigo-400/50' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{ad.title}</p>
                      <p className="text-xs text-slate-400">
                        {ad.advertiser}
                        {ad.boostPlan ? ` · ${ad.boostPlan}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {AD_TYPE_LABEL[typeKey]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full border ${st.badgeClass}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-300">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                      {adCtr(ad)}%
                    </td>
                    <td className="px-4 py-3">
                      <TargetHrefLink targetUrl={ad.targetUrl} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {showPause && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePauseStart(ad)}
                            title="Pauza"
                            aria-label="Pauza"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">pause_circle</span>
                          </button>
                        )}
                        {showStart && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePauseStart(ad)}
                            title="Start"
                            aria-label="Start"
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 disabled:opacity-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">play_circle</span>
                          </button>
                        )}
                        {ad.status === 'PENDING' && ad.sourceKind === 'job' && (
                          <a
                            href={paymentsHref}
                            title="To'lovlar"
                            aria-label="To'lovlar"
                            className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                          </a>
                        )}
                        {ad.deletable && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDelete(ad)}
                            title="O'chirish"
                            aria-label="O'chirish"
                            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-50 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-sm text-slate-400">
            Target topilmadi. Boost to&apos;lovi tasdiqlangan ishlar yoki &quot;Reklama&quot; e&apos;lonlari shu yerda ko&apos;rinadi.
          </p>
        )}
      </div>
    </div>
  );
}
