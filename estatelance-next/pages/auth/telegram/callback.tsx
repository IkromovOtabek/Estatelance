import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginWithTelegram } from '../../../libs/auth';

export default function TelegramCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    // oauth.telegram.org → tgAuthResult (base64 encoded JSON)
    // telegram widget redirect → individual params (id, hash, ...)
    const { tgAuthResult, id, hash, first_name, last_name, username, photo_url, auth_date } = router.query;

    let telegramData: any = null;

    if (tgAuthResult) {
      // oauth.telegram.org flow — base64 encoded JSON
      try {
        const decoded = JSON.parse(atob(String(tgAuthResult)));
        telegramData = {
          id: Number(decoded.id),
          first_name: decoded.first_name ?? '',
          auth_date: Number(decoded.auth_date),
          hash: decoded.hash,
          ...(decoded.last_name  && { last_name:  decoded.last_name  }),
          ...(decoded.username   && { username:   decoded.username   }),
          ...(decoded.photo_url  && { photo_url:  decoded.photo_url  }),
        };
      } catch {
        router.replace('/account?error=telegram_failed');
        return;
      }
    } else if (id && hash) {
      // Widget redirect flow — individual params
      telegramData = {
        id: Number(id),
        first_name: String(first_name ?? ''),
        auth_date: Number(auth_date),
        hash: String(hash),
        ...(last_name  && { last_name:  String(last_name)  }),
        ...(username   && { username:   String(username)   }),
        ...(photo_url  && { photo_url:  String(photo_url)  }),
      };
    } else {
      router.replace('/account?error=telegram_failed');
      return;
    }

    loginWithTelegram(telegramData)
      .then((needsOnboarding) => {
        router.replace(needsOnboarding ? '/account?onboarding=telegram' : '/');
      })
      .catch(() => {
        router.replace('/account?error=telegram_failed');
      });
  }, [router.isReady]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Telegram orqali kirilmoqda...</p>
      </div>
    </div>
  );
}
