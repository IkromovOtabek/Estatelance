/** Admin panel yo‘llari va Targetlar tezkor havolalari (hardcode emas) */

export const ADMIN_BASE_PATH = '/_admin';

export const ADMIN_ROUTES = {
  dashboard: ADMIN_BASE_PATH,
  ads: `${ADMIN_BASE_PATH}/ads`,
  adsCreate: `${ADMIN_BASE_PATH}/ads/create`,
  users: `${ADMIN_BASE_PATH}/users`,
  moderation: `${ADMIN_BASE_PATH}/moderation`,
  settings: `${ADMIN_BASE_PATH}/settings`,
} as const;

export function adminSectionHref(sectionId: string): string {
  return `${ADMIN_BASE_PATH}?section=${encodeURIComponent(sectionId)}`;
}

export const ADMIN_SECTION_IDS = {
  dashboard: 'dashboard',
  users: 'users',
  jobs: 'jobs',
  payments: 'payments',
  posts: 'posts',
  targets: 'targets',
  announcements: 'announcements',
  settings: 'settings',
} as const;

/** Targetlar bo‘limi ichidagi tablar */
export const TARGETS_TAB_IDS = {
  list: 'list',
  ads: 'ads',
  moderation: 'moderation',
  create: 'create',
} as const;

export type TargetsTabId = (typeof TARGETS_TAB_IDS)[keyof typeof TARGETS_TAB_IDS];

export const TARGETS_TABS = [
  { id: TARGETS_TAB_IDS.list, label: 'Targetlar', icon: 'track_changes' },
  { id: TARGETS_TAB_IDS.ads, label: 'Reklamalar', icon: 'campaign' },
  { id: TARGETS_TAB_IDS.moderation, label: 'Moderatsiya', icon: 'visibility' },
] as const;

export function adminTargetsHref(tab: TargetsTabId = TARGETS_TAB_IDS.list): string {
  return `${ADMIN_BASE_PATH}?section=${ADMIN_SECTION_IDS.targets}&tab=${encodeURIComponent(tab)}`;
}

/** Reklama/target yozuvini Targetlar bo‘limida ochish */
export function adminTargetsRecordHref(
  sourceId: string,
  sourceKind: 'job' | 'announcement' | 'user' = 'job',
  tab: TargetsTabId = TARGETS_TAB_IDS.list,
): string {
  const p = new URLSearchParams({
    section: ADMIN_SECTION_IDS.targets,
    tab,
    sourceId,
    sourceKind,
  });
  return `${ADMIN_BASE_PATH}?${p.toString()}`;
}

export function parseTargetsTab(tab: unknown): TargetsTabId {
  const valid = Object.values(TARGETS_TAB_IDS);
  if (typeof tab === 'string' && (valid as string[]).includes(tab)) {
    return tab as TargetsTabId;
  }
  return TARGETS_TAB_IDS.list;
}

export type AdminQuickLinkVariant = 'primary' | 'default';

export interface AdminTargetQuickLink {
  href: string;
  label: string;
  icon: string;
  variant?: AdminQuickLinkVariant;
}

/** Targetlar paneli yuqorisidagi havolalar (tab URL) */
export const ADMIN_TARGET_QUICK_LINKS: AdminTargetQuickLink[] = [
  {
    href: adminTargetsHref(TARGETS_TAB_IDS.create),
    label: 'Yangi target',
    icon: 'add',
    variant: 'primary',
  },
];

export interface AdminBreadcrumbItem {
  href: string;
  label: string;
}

/** Reklama sahifalari uchun step-by-step yo‘l */
export function getAdsBreadcrumbs(page: 'list' | 'create'): AdminBreadcrumbItem[] {
  const items: AdminBreadcrumbItem[] = [
    { href: adminTargetsHref(TARGETS_TAB_IDS.list), label: 'Targetlar' },
    { href: adminTargetsHref(TARGETS_TAB_IDS.ads), label: 'Reklamalar' },
  ];
  if (page === 'create') {
    items.push({ href: adminTargetsHref(TARGETS_TAB_IDS.create), label: 'Yangi target' });
  }
  return items;
}

/** Sidebar pastidagi «Ortga qaytish» */
export function getAdsBackLink(page: 'list' | 'create'): AdminBreadcrumbItem {
  if (page === 'create') {
    return { href: adminTargetsHref(TARGETS_TAB_IDS.ads), label: 'Reklamalarga qaytish' };
  }
  return { href: adminTargetsHref(TARGETS_TAB_IDS.list), label: 'Targetlarga qaytish' };
}

export const AD_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Barcha statuslar' },
  { value: 'ACTIVE', label: 'Faol' },
  { value: 'PAUSED', label: 'Pauza' },
  { value: 'PENDING', label: 'Kutilmoqda' },
  { value: 'ENDED', label: 'Tugagan' },
] as const;
