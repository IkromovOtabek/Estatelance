import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { loginWithTelegram } from '../../../libs/auth';

export default function TelegramCallback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { id, first_name, last_name, username, photo_url, auth_date, hash } = router.query;

    if (!id || !hash) {
      router.replace('/account?error=telegram_failed');
      return;
    }

    const telegramData = {
      id: Number(id),
      first_name: String(first_name ?? ''),
      auth_date: Number(auth_date),
      hash: String(hash),
      ...(last_name  && { last_name:  String(last_name)  }),
      ...(username   && { username:   String(username)   }),
      ...(photo_url  && { photo_url:  String(photo_url)  }),
    };

    loginWithTelegram(telegramData)
      .then((needsOnboarding) => {
        if (needsOnboarding) {
          router.replace('/account?onboarding=telegram');
        } else {
          router.replace('/');
        }
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
