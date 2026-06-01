import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ApolloProvider } from '@apollo/client';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, useTheme as useNextTheme } from 'next-themes';
import { useReactiveVar } from '@apollo/client';
import { apolloClient } from '../apollo/client';
import { restoreUserSession } from '../libs/auth';
import { userVar } from '../apollo/store';
import AnnouncementBanner from '../libs/components/common/AnnouncementBanner';
import SpamModal from '../libs/components/common/SpamModal';
import ChatWidget from '../libs/components/common/ChatWidget';
import { TRACK_VISIT, START_SESSION, TRACK_PAGE, PING_SESSION, END_SESSION } from '../apollo/admin/mutation';
import '../scss/app.scss';

// ─── Visitor ID ───────────────────────────────────────────────────────────────
function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('_vid');
  if (!id) {
    id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('_vid', id);
  }
  return id;
}

// ─── Session ID (per browser tab, using sessionStorage) ───────────────────────
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_sid');
  if (!sid) {
    sid = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('_sid', sid);
  }
  return sid;
}

// ─── Parse User-Agent ─────────────────────────────────────────────────────────
function parseUserAgent(ua: string) {
  // Device
  let device = 'Desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet';
  else if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) device = 'Mobile';

  // OS
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Browser
  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/opr\//i.test(ua)) browser = 'Opera';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/firefox/i.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

// ─── Track a visit event ──────────────────────────────────────────────────────
function trackEvent(event: 'visit' | 'register' | 'login', userId?: string) {
  const visitorId = getOrCreateVisitorId();
  if (!visitorId) return;
  const sessionId = getOrCreateSessionId();
  const input: any = { visitorId, event };
  if (userId) input.userId = userId;
  if (sessionId) input.sessionId = sessionId;
  apolloClient.mutate({ mutation: TRACK_VISIT, variables: { input } }).catch(() => {});
}

export { trackEvent };

// ─── Shared component overrides (outline reset) ───────────────────────────────
const sharedComponents = {
  MuiButtonBase: {
    styleOverrides: {
      root: {
        outline: 'none !important',
        '&:focus': { outline: 'none !important' },
        '&:focus-visible': { outline: 'none !important', boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: { outline: 'none', boxShadow: 'none', '&:focus': { outline: 'none' }, '&:active': { boxShadow: 'none' } },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: { outline: 'none', '&:focus': { outline: 'none' }, '&:focus-visible': { boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' } },
    },
  },
  MuiTab: {
    styleOverrides: { root: { outline: 'none', '&:focus': { outline: 'none' } } },
  },
  MuiMenuItem: {
    styleOverrides: { root: { outline: 'none', '&:focus': { outline: 'none' } } },
  },
} as const;

// ─── Light MUI Theme ──────────────────────────────────────────────────────────
const lightMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5', dark: '#4338ca', light: '#818cf8' },
    secondary: { main: '#0ea5e9' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
    divider: '#e2e8f0',
  },
  typography: { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4f46e5', borderWidth: '1.5px' },
        },
      },
    },
  },
});

// ─── Dark MUI Theme ───────────────────────────────────────────────────────────
const darkMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#818cf8', dark: '#6366f1', light: '#a5b4fc' },
    secondary: { main: '#38bdf8' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    divider: '#334155',
    action: {
      hover: 'rgba(255,255,255,0.06)',
      selected: 'rgba(129,140,248,0.12)',
    },
  },
  typography: { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', button: { textTransform: 'none' } },
  shape: { borderRadius: 8 },
  components: {
    ...sharedComponents,
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none', backgroundColor: '#1e293b', border: '1px solid #334155' },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          outline: 'none',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1' },
          '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366f1', borderWidth: '1px', boxShadow: 'none' },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#94a3b8', '&.Mui-focused': { color: '#818cf8' } } },
    },
    MuiSelect: {
      styleOverrides: { icon: { color: '#94a3b8' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: '#0f172a', backgroundImage: 'none', borderColor: '#1e293b' } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: '#334155', color: '#f1f5f9', fontSize: 12 } },
    },
    MuiChip: {
      styleOverrides: { root: { backgroundColor: '#334155', color: '#e2e8f0' } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: '#334155' } },
    },
    MuiAlert: {
      styleOverrides: { root: { backgroundColor: '#1e293b' } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#334155' } },
    },
    MuiTableCell: {
      styleOverrides: { root: { color: '#e2e8f0', borderColor: '#334155' } },
    },
  },
});

// ─── Dynamic MUI Provider (reacts to next-themes) ─────────────────────────────
function DynamicMuiProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const muiTheme = mounted && resolvedTheme === 'dark' ? darkMuiTheme : lightMuiTheme;
  return (
    <MuiThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

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
  const router = useRouter();

  useEffect(() => {
    restoreUserSession();

    // Track visit event once per session
    // If user is already logged in (token restored), pass userId so the session gets tagged with their name
    const sessionKey = '_tracked';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      const restoredUser = userVar();
      trackEvent('visit', restoredUser?._id || undefined);
    }

    // Start visitor session
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const { device, os, browser } = parseUserAgent(navigator.userAgent);
    const firstPage = window.location.pathname;

    apolloClient.mutate({
      mutation: START_SESSION,
      variables: { input: { sessionId, visitorId, device, os, browser, firstPage } },
    }).catch(() => {});

    // Ping every 30 seconds to show "online"
    const pingInterval = setInterval(() => {
      apolloClient.mutate({ mutation: PING_SESSION, variables: { sessionId } }).catch(() => {});
    }, 30_000);

    // End session on tab close
    const handleUnload = () => {
      navigator.sendBeacon?.('/api/end-session', JSON.stringify({ sessionId }));
      apolloClient.mutate({ mutation: END_SESSION, variables: { input: { sessionId } } }).catch(() => {});
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(pingInterval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Track route changes as page views
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const sessionId = getOrCreateSessionId();
      const path = url.split('?')[0];
      apolloClient.mutate({ mutation: TRACK_PAGE, variables: { input: { sessionId, path } } }).catch(() => {});
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router.events]);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ApolloProvider client={apolloClient}>
        <DynamicMuiProvider>
          <OnboardingGuard>
            <Component {...pageProps} />
          </OnboardingGuard>
          <AnnouncementBanner />
          <SpamModal />
          <ChatWidget />
        </DynamicMuiProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}
