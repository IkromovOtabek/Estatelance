import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { jwtDecode } from 'jwt-decode';
import { saveToken } from '../../../apollo/client';
import { setUserFromToken } from '../../../apollo/store';

export default function GoogleCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { token, error, needsOnboarding } = router.query;

    if (error || !token) {
      router.replace('/account?error=google_failed');
      return;
    }

    try {
      const tokenStr = token as string;
      saveToken(tokenStr);
      const decoded: any = jwtDecode(tokenStr);
      setUserFromToken(decoded);

      if (needsOnboarding === 'true') {
        router.replace('/account?onboarding=google');
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/account?error=google_failed');
    }
  }, [router.isReady, router.query]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Google orqali kirilmoqda...</p>
      </div>
    </div>
  );
}
