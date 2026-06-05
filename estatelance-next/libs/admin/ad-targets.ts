/** Admin targetlar — turlar, statuslar, yordamchi funksiyalar (mock yo‘q) */

export type AdStatus = 'ACTIVE' | 'PAUSED' | 'ENDED' | 'PENDING';

export type AdType = 'BANNER' | 'SPONSORED_JOB' | 'FEATURED_FREELANCER';

/** GraphQL adminGetAdTargets qatoriga mos */
export interface AdminAdTargetRow {
  id: string;
  title: string;
  advertiser: string;
  type: string;
  status: string;
  impressions: number;
  clicks: number;
  targetUrl?: string | null;
  sourceKind: string;
  sourceId?: string | null;
  boostPlan?: string | null;
  createdAt?: string | null;
  manageable?: boolean;
  deletable?: boolean;
}

export const AD_STATUS_META: Record<AdStatus, { label: string; badgeClass: string }> = {
  ACTIVE: {
    label: 'Faol',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  },
  PAUSED: {
    label: 'Pauza',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  },
  ENDED: {
    label: 'Tugagan',
    badgeClass:
      'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  },
  PENDING: {
    label: 'Kutilmoqda',
    badgeClass:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  },
};

export const AD_TYPE_LABEL: Record<AdType, string> = {
  BANNER: 'Banner',
  SPONSORED_JOB: 'Homiylik ish',
  FEATURED_FREELANCER: 'Premium frilanser',
};

export function normalizeAdStatus(status: string): AdStatus {
  return status in AD_STATUS_META ? (status as AdStatus) : 'ENDED';
}

export function normalizeAdType(type: string): AdType {
  return type in AD_TYPE_LABEL ? (type as AdType) : 'SPONSORED_JOB';
}

export function adCtr(ad: Pick<AdminAdTargetRow, 'impressions' | 'clicks'>): string {
  return ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00';
}
