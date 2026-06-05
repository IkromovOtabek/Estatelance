import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminTargetsHref, TARGETS_TAB_IDS } from '../../libs/admin/admin-config';

/** Eski URL — Targetlar bo‘limidagi Reklamalar tabiga */
export default function AdminAdsRedirect() {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    router.replace(adminTargetsHref(TARGETS_TAB_IDS.ads));
  }, [router.isReady, router]);
  return null;
}
