import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginWithTelegram } from '../../../libs/auth';

export default function TelegramCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const q = router.query;

    // oauth.telegram.org → tgAuthResult (base64 JSON)
    // widget data-auth-url → individual params (id, hash, ...)
    let data: any = null;

    if (q.tgAuthResult) {
      try {
        data = JSON.parse(atob(String(q.tgAuthResult)));
      } catch {
        closeOrRedirect('/account?error=telegram_failed');
        return;
      }
    } else if (q.id && q.hash) {
      data = {
        id:         Number(q.id),
        first_name: String(q.first_name ?? ''),
        auth_date:  Number(q.auth_date),
        hash:       String(q.hash),
        ...(q.last_name  && { last_name:  String(q.last_name)  }),
        ...(q.username   && { username:   String(q.username)   }),
        ...(q.photo_url  && { photo_url:  String(q.photo_url)  }),
      };
    } else {
      closeOrRedirect('/account?error=telegram_failed');
      return;
    }

    // Desktop popup: opener ga xabar yuborib oynani yopamiz
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'telegram_auth', data }, window.location.origin);
      window.close();
      return;
    }

    // Mobile / to'g'ridan redirect: loginWithTelegram chaqiramiz
    loginWithTelegram(data)
      .then((needsOnboarding) => {
        router.replace(needsOnboarding ? '/account?onboarding=telegram' : '/');
      })
      .catch(() => {
        router.replace('/account?error=telegram_failed');
      });
  }, [router.isReady]);

  function closeOrRedirect(url: string) {
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'telegram_error' }, window.location.origin);
      window.close();
    } else {
      router.replace(url);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Telegram orqali kirilmoqda...</p>
      </div>
    </div>
  );
}
