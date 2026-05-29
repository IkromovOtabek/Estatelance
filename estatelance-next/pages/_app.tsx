import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useReactiveVar } from '@apollo/client';
import { apolloClient } from '../apollo/client';
import { restoreUserSession } from '../libs/auth';
import { userVar } from '../apollo/store';
import AnnouncementBanner from '../libs/components/common/AnnouncementBanner';
import SpamModal from '../libs/components/common/SpamModal';
import ChatWidget from '../libs/components/common/ChatWidget';
import { TRACK_VISIT } from '../apollo/admin/mutation';
import '../scss/app.scss';

// Get or create a unique visitor ID stored in localStorage
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('_vid');
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('_vid', id);
  }
  return id;
}

// Track a visit event (fire-and-forget, no error handling needed)
function trackEvent(event: 'visit' | 'register' | 'login') {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;
  apolloClient.mutate({
    mutation: TRACK_VISIT,
    variables: { input: { visitorId, event } },
  }).catch(() => {});
}

export { trackEvent };

const theme = createTheme({
  palette: {
    primary: { main: '#4f46e5', dark: '#4338ca', light: '#818cf8' },
    secondary: { main: '#0ea5e9' },
    background: { default: '#f8fafc' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none' },
  },
  shape: { borderRadius: 8 },
});

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useReactiveVar(userVar);

  useEffect(() => {
    if (user._id && user.needsOnboarding && router.pathname !== '/account') {
      router.replace('/account');
    }
  }, [user._id, user.needsOnboarding, router.pathname]);

  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    restoreUserSession();
    // Track page visit once per session
    const sessionKey = '_tracked';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      trackEvent('visit');
    }
  }, []);

  return (
    <ApolloProvider client={apolloClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <OnboardingGuard>
          <Component {...pageProps} />
        </OnboardingGuard>
        <AnnouncementBanner />
        <SpamModal />
        <ChatWidget />
      </ThemeProvider>
    </ApolloProvider>
  );
}
