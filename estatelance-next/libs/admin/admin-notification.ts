import type { Notification } from '../types';
import {
  ADMIN_BASE_PATH,
  ADMIN_SECTION_IDS,
  adminSectionHref,
  adminTargetsHref,
  TARGETS_TAB_IDS,
} from './admin-config';

/** Bildirishnoma bosilganda admin panel ichidagi yo‘l */
export function resolveAdminNotificationHref(n: Notification): string {
  if (n.linkPath?.startsWith(ADMIN_BASE_PATH)) {
    return n.linkPath;
  }

  const title = (n.title ?? '').toLowerCase();
  const desc = (n.description ?? '').toLowerCase();

  if (title.includes('boost') || title.includes("to'lov cheki") || desc.includes('boost chek')) {
    const id = n.relatedItemId;
    if (!id) return adminSectionHref(ADMIN_SECTION_IDS.payments);
    if (title.includes('profil') || desc.includes('profil boost')) {
      return `${adminSectionHref(ADMIN_SECTION_IDS.payments)}&userId=${encodeURIComponent(id)}`;
    }
    return `${adminSectionHref(ADMIN_SECTION_IDS.payments)}&jobId=${encodeURIComponent(id)}`;
  }

  if (title.includes('nizo') || desc.includes('nizo')) {
    const disputeId = n.relatedItemId;
    return disputeId
      ? `${adminTargetsHref(TARGETS_TAB_IDS.moderation)}&disputeId=${encodeURIComponent(disputeId)}`
      : adminTargetsHref(TARGETS_TAB_IDS.moderation);
  }

  if (title.includes('bekor') || desc.includes('bekor qildi')) {
    const jobId = n.relatedItemId;
    return jobId
      ? `${adminTargetsHref(TARGETS_TAB_IDS.moderation)}&jobId=${encodeURIComponent(jobId)}`
      : adminTargetsHref(TARGETS_TAB_IDS.moderation);
  }

  if (title.includes('reklama') || title.includes('target')) {
    return adminTargetsHref(TARGETS_TAB_IDS.ads);
  }

  return adminSectionHref(ADMIN_SECTION_IDS.dashboard);
}
