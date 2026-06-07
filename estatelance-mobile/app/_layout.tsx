import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { ToastProvider } from '../components/Toast';
import { useNotifications } from '../hooks/useNotifications';
import { ThemeProvider } from '../hooks/useThemeContext';
import { ApolloProvider } from '@apollo/client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../apollo/client';
import { AuthContext } from '../hooks/useAuth';
import { User } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Floating orb (background deco) ──────────────────────────────────────────
function Orb({
  size, color, x, y, delay,
}: { size: number; color: string; x: number; y: number; delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 3200 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 3200 + delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const scale      = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.18,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

// ─── BuFu Logo Mark ───────────────────────────────────────────────────────────
function LogoMark({ size = 108 }: { size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.22,
      overflow: 'hidden',
      shadowColor: '#7c3aed',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.55,
      shadowRadius: 24,
      elevation: 12,
    }}>
      <Image
        source={require('../assets/bufu-logo.png')}
        style={{ width: size, height: size }}
        resizeMode="cover"
      />
    </View>
  );
}

// ─── Splash Screen ────────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  // Animation values
  const bgOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.6)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.4)).current;
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const nameY        = useRef(new Animated.Value(24)).current;
  const nameOpacity  = useRef(new Animated.Value(0)).current;
  const tagY         = useRef(new Animated.Value(16)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const exitOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Bg fade-in
    Animated.timing(bgOpacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();

    // 2. Glow burst
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(glowScale,   { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 150);

    // 3. Logo entrance
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 280);

    // 4. App name slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(nameY,      { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
        Animated.timing(nameOpacity,{ toValue: 1, duration: 380, useNativeDriver: true }),
      ]).start();
    }, 560);

    // 5. Tagline
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(tagY,      { toValue: 0, tension: 90, friction: 8, useNativeDriver: true }),
        Animated.timing(tagOpacity,{ toValue: 1, duration: 340, useNativeDriver: true }),
      ]).start();
    }, 720);

    // 6. Progress bar
    setTimeout(() => {
      Animated.timing(barWidth, {
        toValue: SW * 0.45,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, 860);

    // 7. Exit fade
    setTimeout(() => {
      Animated.timing(exitOpacity, { toValue: 0, duration: 320, useNativeDriver: true })
        .start(() => onDone());
    }, 2200);
  }, []);

  return (
    <Animated.View style={[splash.container, { opacity: exitOpacity }]}>
      {/* Background fade */}
      <Animated.View style={[StyleSheet.absoluteFill, splash.bg, { opacity: bgOpacity }]} />

      {/* Orbs */}
      <Orb size={260} color="#a78bfa" x={-60}     y={-40}        delay={0}    />
      <Orb size={200} color="#818cf8" x={SW - 130} y={SH * 0.12}  delay={400}  />
      <Orb size={180} color="#c4b5fd" x={SW * 0.1} y={SH * 0.65}  delay={800}  />
      <Orb size={140} color="#6366f1" x={SW * 0.6} y={SH * 0.72}  delay={200}  />

      {/* Center content */}
      <View style={splash.center}>
        {/* Glow ring */}
        <Animated.View style={[splash.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />

        {/* Logo */}
        <Animated.View style={{ transform: [{ scale: logoScale }], opacity: logoOpacity, marginBottom: 28 }}>
          <LogoMark size={108} />
        </Animated.View>

        {/* App name */}
        <Animated.Text style={[splash.appName, { transform: [{ translateY: nameY }], opacity: nameOpacity }]}>
          BuFu
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[splash.tagline, { transform: [{ translateY: tagY }], opacity: tagOpacity }]}>
          Frilanserlar platformasi
        </Animated.Text>
      </View>

      {/* Bottom: progress bar */}
      <View style={splash.bottom}>
        <View style={splash.barTrack}>
          <Animated.View style={[splash.barFill, { width: barWidth }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const splash = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1040' },
  bg:        { backgroundColor: '#1e1356' },
  center:    { alignItems: 'center', justifyContent: 'center' },
  glow:      {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
  },
  appName:   { fontSize: 38, fontWeight: '800', color: '#ffffff', letterSpacing: 2, marginBottom: 8 },
  tagline:   { fontSize: 14, color: 'rgba(196,181,253,0.8)', letterSpacing: 0.5 },
  bottom:    { position: 'absolute', bottom: 56, alignItems: 'center' },
  barTrack:  { width: SW * 0.45, height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' },
  barFill:   { height: '100%', backgroundColor: '#a78bfa', borderRadius: 4 },
});

// ─── Root Layout ──────────────────────────────────────────────────────────────
function NotificationSetup() {
  useNotifications();
  return null;
}

export default function RootLayout() {
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
      } catch {}
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (u: User) => {
    if (u.accessToken) {
      await AsyncStorage.setItem('accessToken', u.accessToken);
      // Telegram orqali kirgan bo'lsa — tokenni eslab qolamiz (logout dan keyin ham)
      await AsyncStorage.setItem('rememberedToken', u.accessToken);
    }
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    // 'rememberedToken' va 'lastTgUser' ni SAQLAB qolamiz — qayta tez kirish uchun
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    setUser(null);
    apolloClient.clearStore();
  }, []);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
      <SafeAreaProvider>
        <ApolloProvider client={apolloClient}>
          <AuthContext.Provider value={{ user, loading, login, logout }}>
            <NotificationSetup />
            <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)"           options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login"       options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/register"   options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/onboarding" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="jobs/[id]"        options={{ headerShown: false }} />
              <Stack.Screen name="profile/[id]"     options={{ headerShown: false }} />
              <Stack.Screen name="settings"          options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="theme-select"     options={{ headerShown: false, animation: 'slide_from_right' }} />
              <Stack.Screen name="messages/[userId]" options={{ headerShown: false, animation: 'slide_from_right' }} />
            </Stack>
            </ToastProvider>
          </AuthContext.Provider>
        </ApolloProvider>
      </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
