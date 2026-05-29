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
  botName: string;          // Your Telegram bot username (without @)
  onAuth: (data: TelegramAuthData) => void; // Called when user authenticates
  buttonSize?: 'large' | 'medium' | 'small';
  cornerRadius?: number;
  requestAccess?: boolean;  // Request permission to send messages
}

// This component injects the official Telegram Login Widget script.
// When the user clicks the button and authenticates, Telegram calls our callback
// with signed user data that we send to our backend for verification.
//
// SETUP REQUIRED:
// 1. Create a bot with @BotFather on Telegram
// 2. Use /setdomain command to register your website's domain with the bot
// 3. Set NEXT_PUBLIC_TELEGRAM_BOT_NAME in your .env.local file
const TelegramLoginButton = ({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 8,
  requestAccess = true,
}: TelegramLoginButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !botName) return;

    // Make the callback globally accessible so Telegram's script can call it
    (window as any).onTelegramAuth = (user: TelegramAuthData) => {
      onAuth(user);
    };

    // Create and inject the Telegram Login Widget script
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
      // Cleanup when the component unmounts
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName, buttonSize, cornerRadius, requestAccess]);

  if (!botName) {
    return (
      <div style={{ padding: '8px', color: '#999', fontSize: '12px', textAlign: 'center' }}>
        Telegram bot name not configured
      </div>
    );
  }

  return <div ref={containerRef} />;
};

export default TelegramLoginButton;
