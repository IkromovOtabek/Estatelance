import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { adminSectionHref } from '../../libs/admin/admin-config';

/** Eski URL — asosiy admin layout ichidagi sozlamalar bo‘limiga yo‘naltiradi */
export default function AdminSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    router.replace(adminSectionHref('settings'));
  }, [router.isReady, router]);

  return null;
}
