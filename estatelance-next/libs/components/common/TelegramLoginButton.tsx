import { useEffect, useRef, useState } from 'react';

interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginButtonProps {
  botName: string;
  onAuth: (data: TelegramAuthData) => void;
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

const TelegramLoginButton = ({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = true,
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  // ── Redirect mode (mobil) ──────────────────────────────────────────────────
  // Telegram callback sahifasini Next.js da /auth/telegram/callback ga yo'naltiramiz
  useEffect(() => {
    if (!mobile) return;

    // Redirect mode uchun: Telegram token ni URL dan o'qiymiz
    const params = new URLSearchParams(window.location.search);
    const tgHash = params.get('hash');
    if (!tgHash) return;

    // Barcha tg_ parametrlarni yig'ib onAuth ga uzatamiz
    const data: any = {};
    ['id','first_name','last_name','username','photo_url','auth_date','hash'].forEach(k => {
      const v = params.get(k);
      if (v) data[k] = k === 'id' || k === 'auth_date' ? Number(v) : v;
    });

    if (data.id && data.hash) {
      onAuth(data as TelegramAuthData);
      // URL ni tozalaymiz
      const clean = window.location.pathname;
      window.history.replaceState({}, '', clean);
    }
  }, [mobile]);

  // ── Widget mode (desktop) ─────────────────────────────────────────────────
  useEffect(() => {
    if (mobile || !containerRef.current || !botName) return;

    (window as any).onTelegramAuth = (user: TelegramAuthData) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'false');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      delete (window as any).onTelegramAuth;
    };
  }, [mobile, botName, buttonSize, cornerRadius, requestAccess]);

  if (!botName) return null;

  // Mobil uchun — redirect URL ga yo'naltiruvchi tugma
  if (mobile) {
    const returnUrl = typeof window !== 'undefined'
      ? encodeURIComponent(window.location.href)
      : '';
    // botName = "buildfuture_bot" → bot_id = 8501731906
    const BOT_ID = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || botName;
    const tgAuthUrl = `https://oauth.telegram.org/auth?bot_id=${BOT_ID}&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&embed=0&request_access=${requestAccess ? 'write' : 'read'}&return_to=${returnUrl}`;

    return (
      <a
        href={tgAuthUrl}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 20px',
          backgroundColor: '#2AABEE',
          color: 'white',
          borderRadius: cornerRadius,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 14,
          fontFamily: 'sans-serif',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.668l-2.95-.924c-.642-.204-.657-.642.136-.953l11.527-4.444c.535-.194 1.003.13.589.901z"/>
        </svg>
        Telegram orqali kirish
      </a>
    );
  }

  return <div ref={containerRef} />;
};

export default TelegramLoginButton;
