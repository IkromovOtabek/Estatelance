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

// Bot numeric ID — required for oauth.telegram.org
const BOT_ID = '8501731906';

function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

// ─── Mobile: oauth.telegram.org (web page, no app required) ──────────────────
function TelegramOAuthButton({ onAuth, cornerRadius = 8 }: {
  onAuth: (data: TelegramAuthData) => void;
  cornerRadius?: number;
}) {
  const handleClick = () => {
    const origin = window.location.origin;
    const returnTo = `${origin}/auth/telegram/callback`;
    const url = `https://oauth.telegram.org/auth?bot_id=${BOT_ID}&origin=${encodeURIComponent(origin)}&embed=0&request_access=write&return_to=${encodeURIComponent(returnTo)}`;

    // Popup ochishga urinib ko'ramiz
    const popup = window.open(url, 'TelegramAuth', 'width=550,height=600,resizable=yes,scrollbars=yes');

    if (!popup || popup.closed) {
      // Popup bloklan­gan → to'g'ridan redirect
      window.location.href = url;
      return;
    }

    // Popup dan xabar kutamiz
    const handler = (e: MessageEvent) => {
      if (e.origin !== 'https://oauth.telegram.org') return;
      if (e.data?.event !== 'auth_result') return;
      window.removeEventListener('message', handler);
      popup.close();
      if (e.data.result) onAuth(e.data.result as TelegramAuthData);
    };
    window.addEventListener('message', handler);

    // Popup yopilsa handler ni tozalaymiz
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', handler);
      }
    }, 500);
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '10px 20px',
        width: '100%',
        backgroundColor: '#2AABEE',
        color: 'white',
        borderRadius: cornerRadius,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 14,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: 0.2,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.01 9.47c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.668l-2.95-.924c-.642-.204-.657-.642.136-.953l11.527-4.444c.535-.194 1.003.13.589.901z"/>
      </svg>
      Telegram orqali kirish
    </button>
  );
}

// ─── Desktop: official Telegram Login Widget ─────────────────────────────────
function TelegramWidget({ botName, onAuth, buttonSize, cornerRadius, requestAccess }: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !botName) return;

    (window as any).onTelegramAuth = (user: TelegramAuthData) => onAuth(user);

    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize ?? 'large');
    script.setAttribute('data-radius', String(cornerRadius ?? 8));
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'false');
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      delete (window as any).onTelegramAuth;
    };
  }, [botName, buttonSize, cornerRadius, requestAccess]);

  return <div ref={containerRef} />;
}

// ─── Main export ──────────────────────────────────────────────────────────────
const TelegramLoginButton = (props: TelegramLoginButtonProps) => {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobileDevice());
  }, []);

  if (!props.botName) return null;

  if (mobile) {
    return <TelegramOAuthButton onAuth={props.onAuth} cornerRadius={props.cornerRadius} />;
  }

  return <TelegramWidget {...props} />;
};

export default TelegramLoginButton;
