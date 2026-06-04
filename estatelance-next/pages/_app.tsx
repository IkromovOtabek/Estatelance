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
// ─── Light MUI Theme — Minimal & Clean ───────────────────────────────────────
const lightMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#6366F1', dark: '#4F46E5', light: '#818CF8' },
    secondary:  { main: '#A855F7' },
    background: { default: '#FAFAFA', paper: '#FFFFFF' },
    text:       { primary: '#18181B', secondary: '#71717A' },
    divider:    '#E4E4E7',
    action: {
      hover:    'rgba(99,102,241,0.05)',
      selected: 'rgba(99,102,241,0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    h1: { letterSpacing: '-0.03em', fontWeight: 800 },
    h2: { letterSpacing: '-0.025em', fontWeight: 800 },
    h3: { letterSpacing: '-0.02em', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    ...sharedComponents,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4E4E7',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E4E4E7' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#A1A1AA' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6366F1', borderWidth: '1.5px' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 600, letterSpacing: '-0.01em' },
        containedPrimary: {
          background: '#6366F1',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          '&:hover': { background: '#4F46E5', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' },
        },
      },
    },
  },
});

// ─── Dark MUI Theme — Dark Premium ────────────────────────────────────────────
const darkMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#A855F7', dark: '#9333EA', light: '#C084FC' },
    secondary:  { main: '#C084FC' },
    background: { default: '#09090B', paper: '#111111' },
    text:       { primary: '#FAFAFA', secondary: '#71717A' },
    divider:    '#27272A',
    action: {
      hover:    'rgba(168,85,247,0.08)',
      selected: 'rgba(168,85,247,0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    h1: { letterSpacing: '-0.03em', fontWeight: 800 },
    h2: { letterSpacing: '-0.025em', fontWeight: 800 },
    h3: { letterSpacing: '-0.02em', fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    ...sharedComponents,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#111111',
          border: '1px solid #27272A',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, fontWeight: 600, letterSpacing: '-0.01em' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #A855F7, #9333EA)',
          boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #9333EA, #7C3AED)',
            boxShadow: '0 6px 24px rgba(168,85,247,0.5)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
          outline: 'none',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#27272A' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3F3F46' },
          '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#A855F7', borderWidth: '1.5px',
            boxShadow: '0 0 0 3px rgba(168,85,247,0.15)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#71717A', '&.Mui-focused': { color: '#C084FC' } } },
    },
    MuiSelect: {
      styleOverrides: { icon: { color: '#71717A' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#09090B', borderBottom: '1px solid #27272A' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: '#09090B', backgroundImage: 'none', borderColor: '#27272A' } },
    },
    MuiTooltip: {
      styleOverrides: { tooltip: { backgroundColor: '#27272A', color: '#FAFAFA', fontSize: 12, border: '1px solid #3F3F46' } },
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
