import { useEffect, useRef } from 'react';

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

const TelegramLoginButton = ({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = true,
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // onAuth ni ref'da saqlaymiz — shunda callback identifikatori o'zgarganda
  // (parent har render'da yangi funksiya bersa) widget qayta yuklanmaydi.
  // Aks holda har tugma bosishda widget destroy/reload bo'lib, sahifa sakraydi.
  const onAuthRef = useRef(onAuth);
  useEffect(() => { onAuthRef.current = onAuth; }, [onAuth]);

  useEffect(() => {
    if (!containerRef.current || !botName) return;

    // Popup yoki redirect dan kelgan auth data ni tinglash
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'telegram_auth' && e.data?.data) {
        onAuthRef.current(e.data.data as TelegramAuthData);
      }
    };
    window.addEventListener('message', handleMessage);

    // Widget skriptini yuklash — data-auth-url bilan (redirect mode)
    // Bu desktop da popup, mobilda Telegram app orqali ishlaydi
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', buttonSize);
    script.setAttribute('data-radius', String(cornerRadius));
    script.setAttribute('data-request-access', requestAccess ? 'write' : 'false');
    // Redirect mode — popup va mobile ikkalasida ham ishlaydi
    const callbackUrl = `${window.location.origin}/auth/telegram/callback`;
    script.setAttribute('data-auth-url', callbackUrl);
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      window.removeEventListener('message', handleMessage);
    };
  }, [botName, buttonSize, cornerRadius, requestAccess]);

  if (!botName) return null;
  return <div ref={containerRef} />;
};

export default TelegramLoginButton;
