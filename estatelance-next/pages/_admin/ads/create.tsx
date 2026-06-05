import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminTargetsHref, TARGETS_TAB_IDS } from '../../../libs/admin/admin-config';

/** Eski URL — Targetlar bo‘limidagi yangi target yaratish */
export default function AdminAdsCreateRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(adminTargetsHref(TARGETS_TAB_IDS.create));
  }, [router.isReady, router]);
  return null;
}
