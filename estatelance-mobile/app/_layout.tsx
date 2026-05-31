import React, { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apolloClient } from '../apollo/client';
import { AuthContext } from '../hooks/useAuth';
import { User } from '../types';

function SplashScreen({ onDone }: { onDone: () => void }) {
  const scale = new Animated.Value(0.7);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={splash.container}>
      <Animated.View style={[splash.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={splash.logoBox}>
          <Text style={splash.logoText}>BF</Text>
        </View>
        <Text style={splash.appName}>BuFu</Text>
        <Text style={splash.tagline}>Frilanserlar platformasi</Text>
      </Animated.View>
    </View>
  );
}

const splash = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  logoWrap:  { alignItems: 'center' },
  logoBox:   { width: 90, height: 90, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  logoText:  { fontSize: 34, fontWeight: '900', color: 'white' },
  appName:   { fontSize: 32, fontWeight: '900', color: 'white', letterSpacing: 1 },
  tagline:   { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
});

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (u.accessToken) await AsyncStorage.setItem('accessToken', u.accessToken);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['accessToken', 'user']);
    setUser(null);
    apolloClient.clearStore();
  }, []);

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ApolloProvider client={apolloClient}>
          <AuthContext.Provider value={{ user, loading, login, logout }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
              <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
              <Stack.Screen name="jobs/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="messages" options={{ headerShown: false, animation: 'slide_from_right' }} />
            </Stack>
          </AuthContext.Provider>
        </ApolloProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
