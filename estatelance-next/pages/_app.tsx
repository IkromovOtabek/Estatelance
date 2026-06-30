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
import AuthRequiredModal from '../libs/components/common/AuthRequiredModal';
import SiteBackground from '../libs/components/layout/SiteBackground';
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
  MuiInputBase: {
    styleOverrides: {
      input: {
        outline: 'none !important',
        outlineOffset: '0 !important',
        '&:focus':         { outline: 'none !important' },
        '&:focus-visible': { outline: 'none !important' },
      },
    },
  },
} as const;

// ─── Light MUI Theme ──────────────────────────────────────────────────────────
// ─── Light MUI Theme — Minimal & Clean ───────────────────────────────────────
const lightMuiTheme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#4F46E5', dark: '#4338CA', light: '#818CF8' },
    secondary:  { main: '#818CF8' },
    background: { default: '#F4F5FF', paper: '#FFFFFF' },
    text:       { primary: '#0F172A', secondary: '#64748B' },
    divider:    '#E2E8F0',
    action: {
      hover:    'rgba(79,70,229,0.05)',
      selected: 'rgba(79,70,229,0.08)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    h1: { letterSpacing: '-0.03em', fontWeight: 800 },
    h2: { letterSpacing: '-0.025em', fontWeight: 800 },
    h3: { letterSpacing: '-0.02em', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    ...sharedComponents,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94A3B8' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5', borderWidth: '1.5px' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14, fontWeight: 600, letterSpacing: '-0.01em',
          transition: 'transform .18s cubic-bezier(0.22,1,0.36,1), box-shadow .18s cubic-bezier(0.22,1,0.36,1), background-color .18s ease',
          '&:active': { transform: 'scale(0.98)' },
        },
        containedPrimary: {
          background: '#4F46E5',
          boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
          '&:hover': { background: '#4338CA', boxShadow: '0 4px 16px rgba(99,102,241,0.4)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { backgroundColor: '#F1F5F9', color: '#27272F', fontWeight: 600, borderRadius: 8 },
      },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#E2E8F0' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#0F172A', color: '#F8FAFC', fontSize: 12, fontWeight: 500, borderRadius: 8, padding: '6px 10px' },
        arrow: { color: '#0F172A' },
      },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' } },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#64748B', '&.Mui-focused': { color: '#4F46E5' } } },
    },
  },
});

// ─── Dark MUI Theme — Dark Premium ────────────────────────────────────────────
const darkMuiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#818CF8', dark: '#6366F1', light: '#A5B4FC' },
    secondary:  { main: '#A5B4FC' },
    background: { default: '#0A0A0F', paper: '#16161F' },
    text:       { primary: '#F4F4F5', secondary: '#A1A1AA' },
    divider:    '#27272F',
    action: {
      hover:    'rgba(129,140,248,0.08)',
      selected: 'rgba(129,140,248,0.12)',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    h1: { letterSpacing: '-0.03em', fontWeight: 800 },
    h2: { letterSpacing: '-0.025em', fontWeight: 800 },
    h3: { letterSpacing: '-0.02em', fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    ...sharedComponents,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#16161F',
          border: '1px solid #27272F',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14, fontWeight: 600, letterSpacing: '-0.01em',
          transition: 'transform .18s cubic-bezier(0.22,1,0.36,1), box-shadow .18s cubic-bezier(0.22,1,0.36,1), background .18s ease',
          '&:active': { transform: 'scale(0.98)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          boxShadow: '0 4px 18px rgba(99,102,241,0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            filter: 'brightness(1.08)',
            boxShadow: '0 6px 24px rgba(99,102,241,0.5)',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#16161F',
          outline: 'none',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#27272F' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3A3A48' },
          '&.Mui-focused': { outline: 'none', boxShadow: 'none' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#818CF8', borderWidth: '1.5px',
            boxShadow: '0 0 0 3px rgba(129,140,248,0.15)',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: '#A1A1AA', '&.Mui-focused': { color: '#A5B4FC' } } },
    },
    MuiSelect: {
      styleOverrides: { icon: { color: '#A1A1AA' } },
    },
    MuiAppBar: {
      styleOverrides: { root: { backgroundImage: 'none', backgroundColor: '#0A0A0F', borderBottom: '1px solid #27272F' } },
    },
    MuiDrawer: {
      styleOverrides: { paper: { backgroundColor: '#0A0A0F', backgroundImage: 'none', borderColor: '#27272F' } },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: '#16161F', color: '#F4F4F5', fontSize: 12, fontWeight: 500, borderRadius: 8, padding: '6px 10px', border: '1px solid #27272F' },
        arrow: { color: '#16161F' },
      },
    },
    MuiChip: {
      styleOverrides: { root: { backgroundColor: '#27272F', color: '#D4D4D8', fontWeight: 600, borderRadius: 8 } },
    },
    MuiSkeleton: {
      styleOverrides: { root: { backgroundColor: '#27272F' } },
    },
    MuiAlert: {
      styleOverrides: { root: { backgroundColor: '#16161F' } },
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#27272F' } },
    },
    MuiTableCell: {
      styleOverrides: { root: { color: '#e2e8f0', borderColor: '#27272F' } },
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

function AppShell({ children, showBackground }: { children: React.ReactNode; showBackground: boolean }) {
  return (
    <>
      {showBackground && <SiteBackground />}
      <div className="site-content">{children}</div>
    </>
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
      const payload = JSON.stringify({ sessionId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/end-session',
          new Blob([payload], { type: 'application/json' }),
        );
      }
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

  const isAdmin = router.pathname.startsWith('/_admin');

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ApolloProvider client={apolloClient}>
        <DynamicMuiProvider>
          <OnboardingGuard>
            <AppShell showBackground={!isAdmin}>
              <Component {...pageProps} />
            </AppShell>
          </OnboardingGuard>
          <AnnouncementBanner />
          <SpamModal />
          <AuthRequiredModal />
          <ChatWidget />
        </DynamicMuiProvider>
      </ApolloProvider>
    </ThemeProvider>
  );
}
