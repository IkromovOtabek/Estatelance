import React from 'react';
import { useRouter } from 'next/router';
import {
  TARGETS_TABS,
  TARGETS_TAB_IDS,
  type TargetsTabId,
} from '../../admin/admin-config';
import AdminTargetsPanel from './AdminTargetsPanel';
import AdminAdsPanel from './AdminAdsPanel';
import AdminModerationPanel from './AdminModerationPanel';
import AdminAdCreatePanel from './AdminAdCreatePanel';

interface AdminTargetsSectionProps {
  tab: TargetsTabId;
  onTabChange: (tab: TargetsTabId) => void;
}

export default function AdminTargetsSection({ tab, onTabChange }: AdminTargetsSectionProps) {
  const router = useRouter();
  const focusJobId = typeof router.query.jobId === 'string' ? router.query.jobId : undefined;
  const focusDisputeId = typeof router.query.disputeId === 'string' ? router.query.disputeId : undefined;
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Targetlar</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Reklama targetlari, kampaniyalar va moderatsiya — bitta bo‘limda.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 dark:border-[#1e293b] pb-3">
        {TARGETS_TABS.map((item) => {
          const active = tab === item.id || (tab === TARGETS_TAB_IDS.create && item.id === TARGETS_TAB_IDS.ads);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                active
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e293b]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onTabChange(TARGETS_TAB_IDS.create)}
          className={`ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === TARGETS_TAB_IDS.create
              ? 'bg-indigo-600 text-white'
              : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Yangi target
        </button>
      </div>

      {tab === TARGETS_TAB_IDS.list && <AdminTargetsPanel />}
      {tab === TARGETS_TAB_IDS.ads && (
        <AdminAdsPanel onCreate={() => onTabChange(TARGETS_TAB_IDS.create)} />
      )}
      {tab === TARGETS_TAB_IDS.moderation && (
        <AdminModerationPanel focusJobId={focusJobId} focusDisputeId={focusDisputeId} />
      )}
      {tab === TARGETS_TAB_IDS.create && (
        <AdminAdCreatePanel
          onCancel={() => onTabChange(TARGETS_TAB_IDS.ads)}
          onSuccess={() => onTabChange(TARGETS_TAB_IDS.ads)}
        />
      )}
    </div>
  );
}
